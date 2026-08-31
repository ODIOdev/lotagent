import { FEE_PRESETS } from "@/lib/data/fee-presets";

const STORAGE_KEY = "lotagent.auction.percents.v1";

export interface AuctionPercentStore {
  selected: string;
  percents: Record<string, string>;
}

function defaultPercent(id: string): string {
  const schedule = FEE_PRESETS.find((item) => item.id === id);
  if (schedule?.buyerFee.kind === "percentage" && schedule.buyerFee.percent > 0) {
    return String(schedule.buyerFee.percent);
  }
  if (id === "fee-copart") return "6";
  return "5";
}

export function defaultAuctionPercents(): Record<string, string> {
  return Object.fromEntries(FEE_PRESETS.map((item) => [item.id, defaultPercent(item.id)]));
}

export function emptyAuctionStore(): AuctionPercentStore {
  return {
    selected: FEE_PRESETS[0]?.id ?? "fee-manheim",
    percents: defaultAuctionPercents(),
  };
}

export function loadAuctionStore(): AuctionPercentStore {
  const fallback = emptyAuctionStore();
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<AuctionPercentStore>;
    return {
      selected: parsed.selected || fallback.selected,
      percents: { ...fallback.percents, ...(parsed.percents ?? {}) },
    };
  } catch {
    return fallback;
  }
}

export function percentForAuction(store: AuctionPercentStore, id: string): string {
  return store.percents[id] ?? defaultPercent(id);
}

export function writeAuctionStore(store: AuctionPercentStore): AuctionPercentStore {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
  return store;
}
