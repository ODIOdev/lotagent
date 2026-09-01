const STORAGE_KEY = "lotagent.worksheets.v1";

export type WorksheetKind = "buy" | "watch";

export interface SavedWorksheet {
  id: string;
  kind: WorksheetKind;
  createdAt: string;
  title: string;
  brand: string;
  model: string;
  year: string;
  miles: string;
  trim: string;
  buyPrice: string;
  auctionPercent: string;
  auctionName: string;
  pickupZip: string;
  deliveryZip: string;
  routeMiles: string;
  auctionFee: number;
  transportFee: number;
  landed: number;
}

export function loadWorksheets(): SavedWorksheet[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<Omit<SavedWorksheet, "kind"> & { kind?: string }>;
    if (!Array.isArray(parsed)) return [];
    let migrated = false;
    const next = parsed.map((item) => {
      if (item.kind === "draft") {
        migrated = true;
        return { ...item, kind: "watch" as const };
      }
      return item as SavedWorksheet;
    });
    if (migrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function worksheetsByKind(kind: WorksheetKind): SavedWorksheet[] {
  return loadWorksheets()
    .filter((item) => item.kind === kind)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveWorksheet(entry: Omit<SavedWorksheet, "id" | "createdAt">): SavedWorksheet {
  const record: SavedWorksheet = {
    ...entry,
    id: `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const next = [record, ...loadWorksheets()];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return record;
}
