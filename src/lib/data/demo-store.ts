import { calculateAuctionFees } from "@/lib/calc/fees";
import { createSeedState } from "@/lib/data/seed";
import { uid } from "@/lib/format";
import type {
  AppState,
  AuctionFeeSchedule,
  ComparisonSet,
  Dealership,
  Purchase,
  PurchaseStatus,
  SavedLocation,
  TransportationEstimate,
  UserProfile,
  UserSettings,
  Worksheet,
  WorksheetStatus,
} from "@/lib/types";
import { PURCHASE_STATUSES } from "@/lib/types";

const STORAGE_KEY = "lotagent.demo.v1";
const SESSION_KEY = "lotagent.demo.session";

let memory: AppState | null = null;
const listeners = new Set<() => void>();

function clone<T>(value: T): T {
  return structuredClone(value);
}

function persist(state: AppState) {
  memory = state;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((listener) => listener());
}

function readStored(): AppState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function getDemoState(): AppState {
  if (memory) return memory;
  memory = readStored() ?? createSeedState();
  return memory;
}

export function subscribeDemo(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetDemoData(): AppState {
  const next = createSeedState();
  persist(next);
  return next;
}

function update(mutator: (draft: AppState) => void): AppState {
  const next = clone(getDemoState());
  mutator(next);
  persist(next);
  return next;
}

function log(state: AppState, message: string, entityType: string, entityId: string) {
  state.activity.unshift({
    id: uid("act"),
    at: new Date().toISOString(),
    message,
    entityType,
    entityId,
  });
  state.activity = state.activity.slice(0, 50);
}

export function upsertWorksheet(sheet: Worksheet): AppState {
  return update((state) => {
    const index = state.worksheets.findIndex((item) => item.id === sheet.id);
    const next = { ...sheet, updatedAt: new Date().toISOString() };
    if (index >= 0) state.worksheets[index] = next;
    else state.worksheets.unshift(next);
    log(state, `Saved worksheet ${sheet.vehicle.year} ${sheet.vehicle.make} ${sheet.vehicle.model}`, "worksheet", sheet.id);
  });
}

export function deleteWorksheet(id: string): AppState {
  return update((state) => {
    state.worksheets = state.worksheets.filter((item) => item.id !== id);
    state.watchlistIds = state.watchlistIds.filter((item) => item !== id);
    state.purchases = state.purchases.filter((item) => item.worksheetId !== id);
    log(state, "Deleted an acquisition worksheet", "worksheet", id);
  });
}

export function toggleWatchlist(id: string): AppState {
  return update((state) => {
    if (state.watchlistIds.includes(id)) {
      state.watchlistIds = state.watchlistIds.filter((item) => item !== id);
      log(state, "Removed vehicle from watchlist", "worksheet", id);
    } else {
      state.watchlistIds.unshift(id);
      const sheet = state.worksheets.find((item) => item.id === id);
      if (sheet && sheet.status === "draft") sheet.status = "watching";
      log(state, "Added vehicle to watchlist", "worksheet", id);
    }
  });
}

export function setWorksheetStatus(id: string, status: WorksheetStatus): AppState {
  return update((state) => {
    const sheet = state.worksheets.find((item) => item.id === id);
    if (!sheet) return;
    sheet.status = status;
    sheet.updatedAt = new Date().toISOString();
    log(state, `Marked ${sheet.vehicle.make} ${sheet.vehicle.model} as ${status}`, "worksheet", id);
  });
}

export function markWon(id: string): AppState {
  return update((state) => {
    const sheet = state.worksheets.find((item) => item.id === id);
    if (!sheet) return;
    sheet.status = "won";
    sheet.updatedAt = new Date().toISOString();
    if (!state.watchlistIds.includes(id)) {
      /* keep historical */
    }
    const existing = state.purchases.find((item) => item.worksheetId === id);
    if (!existing) {
      const fees =
        sheet.costs.auctionBuyerFee +
        sheet.costs.internetBiddingFee +
        sheet.costs.gateFee +
        sheet.costs.titleFee +
        sheet.costs.documentationFee;
      const repairs =
        sheet.costs.mechanicalRepairs +
        sheet.costs.bodyRepairs +
        sheet.costs.tires +
        sheet.costs.brakes +
        sheet.costs.keys;
      const recon = sheet.costs.detailing + sheet.costs.reconditioning + sheet.costs.inspection;
      const bid = sheet.costs.expectedWinningBid || sheet.costs.currentBid;
      const purchase: Purchase = {
        id: uid("pur"),
        worksheetId: id,
        status: "won",
        actuals: {
          winningBid: bid,
          auctionFees: fees,
          transportation: sheet.costs.transportation,
          repairs,
          reconditioning: recon,
          totalCost: bid + fees + sheet.costs.transportation + repairs + recon,
          listedPrice: sheet.profitTargets.expectedSellingPrice,
          soldPrice: 0,
          saleDate: null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.purchases.unshift(purchase);
      state.purchaseHistory.unshift({
        id: uid("ph"),
        purchaseId: purchase.id,
        status: "won",
        at: new Date().toISOString(),
        note: "Won at auction",
      });
    }
    log(state, `Won ${sheet.vehicle.year} ${sheet.vehicle.make} ${sheet.vehicle.model}`, "purchase", id);
  });
}

export function updatePurchase(purchase: Purchase): AppState {
  return update((state) => {
    const index = state.purchases.findIndex((item) => item.id === purchase.id);
    if (index >= 0) state.purchases[index] = { ...purchase, updatedAt: new Date().toISOString() };
  });
}

export function advancePurchaseStatus(purchaseId: string, status: PurchaseStatus, note = ""): AppState {
  return update((state) => {
    const purchase = state.purchases.find((item) => item.id === purchaseId);
    if (!purchase) return;
    purchase.status = status;
    purchase.updatedAt = new Date().toISOString();
    if (status === "sold" && !purchase.actuals.saleDate) {
      purchase.actuals.saleDate = new Date().toISOString();
    }
    state.purchaseHistory.unshift({
      id: uid("ph"),
      purchaseId,
      status,
      at: new Date().toISOString(),
      note,
    });
    log(state, `Purchase moved to ${status.replaceAll("_", " ")}`, "purchase", purchaseId);
  });
}

export function nextPurchaseStatus(status: PurchaseStatus): PurchaseStatus | null {
  const index = PURCHASE_STATUSES.indexOf(status);
  if (index < 0 || index === PURCHASE_STATUSES.length - 1) return null;
  return PURCHASE_STATUSES[index + 1];
}

export function upsertFeeSchedule(schedule: AuctionFeeSchedule): AppState {
  return update((state) => {
    const index = state.feeSchedules.findIndex((item) => item.id === schedule.id);
    if (index >= 0) state.feeSchedules[index] = schedule;
    else state.feeSchedules.push(schedule);
    log(state, `Saved fee schedule ${schedule.name}`, "fee", schedule.id);
  });
}

export function duplicateFeeSchedule(id: string): AppState {
  return update((state) => {
    const source = state.feeSchedules.find((item) => item.id === id);
    if (!source) return;
    const copy: AuctionFeeSchedule = {
      ...clone(source),
      id: uid("fee"),
      name: `${source.name} copy`,
      auctionKey: "custom",
    };
    state.feeSchedules.push(copy);
    log(state, `Duplicated ${source.name}`, "fee", copy.id);
  });
}

export function setFeeScheduleActive(id: string, active: boolean): AppState {
  return update((state) => {
    const schedule = state.feeSchedules.find((item) => item.id === id);
    if (schedule) schedule.active = active;
  });
}

export function upsertTransport(estimate: TransportationEstimate): AppState {
  return update((state) => {
    const index = state.transports.findIndex((item) => item.id === estimate.id);
    if (index >= 0) state.transports[index] = estimate;
    else state.transports.unshift(estimate);
    if (estimate.worksheetId) {
      const sheet = state.worksheets.find((item) => item.id === estimate.worksheetId);
      if (sheet) {
        sheet.costs.transportation =
          estimate.estimatedDistance * estimate.costPerMile +
          estimate.flatPickupCharge +
          estimate.inoperableSurcharge +
          estimate.enclosedSurcharge +
          estimate.urgentSurcharge +
          estimate.tollEstimate;
        sheet.updatedAt = new Date().toISOString();
      }
    }
  });
}

export function upsertLocation(location: SavedLocation): AppState {
  return update((state) => {
    const index = state.savedLocations.findIndex((item) => item.id === location.id);
    if (index >= 0) state.savedLocations[index] = location;
    else state.savedLocations.push(location);
  });
}

export function deleteLocation(id: string): AppState {
  return update((state) => {
    state.savedLocations = state.savedLocations.filter((item) => item.id !== id);
  });
}

export function updateSettings(settings: UserSettings): AppState {
  return update((state) => {
    state.settings = settings;
    log(state, "Updated acquisition settings", "settings", "settings");
  });
}

export function updateProfile(profile: UserProfile): AppState {
  return update((state) => {
    state.profile = profile;
  });
}

export function updateDealership(dealership: Dealership): AppState {
  return update((state) => {
    state.dealership = dealership;
  });
}

export function setComparison(ids: string[]): AppState {
  return update((state) => {
    const set: ComparisonSet = {
      id: state.comparisons[0]?.id ?? uid("cmp"),
      worksheetIds: ids.slice(0, 4),
      createdAt: new Date().toISOString(),
    };
    state.comparisons = [set];
  });
}

export function applyScheduleToWorksheet(sheet: Worksheet, schedule: AuctionFeeSchedule): Worksheet {
  if (sheet.costs.feeOverride) return sheet;
  const bid = sheet.costs.expectedWinningBid || sheet.costs.currentBid;
  const fees = calculateAuctionFees(schedule, bid);
  return {
    ...sheet,
    costs: {
      ...sheet.costs,
      auctionBuyerFee: fees.buyerFee,
      internetBiddingFee: fees.internetFee,
      gateFee: fees.gateFee,
      titleFee: fees.titleFee,
      documentationFee: fees.documentationFee,
      salesTax: fees.tax,
    },
  };
}

export function getDemoSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SESSION_KEY) === "1";
}

export function setDemoSession(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) {
    window.localStorage.setItem(SESSION_KEY, "1");
    document.cookie = "la_demo=1; path=/; SameSite=Lax";
  } else {
    window.localStorage.removeItem(SESSION_KEY);
    document.cookie = "la_demo=; path=/; max-age=0";
  }
}

export function exportStateCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const text = String(value);
    if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
      return `"${text.replaceAll("\"", "\"\"")}"`;
    }
    return text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key] ?? "")).join(","))].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
