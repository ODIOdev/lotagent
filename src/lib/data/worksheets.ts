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

export function getWorksheet(id: string): SavedWorksheet | undefined {
  return loadWorksheets().find((item) => item.id === id);
}

export function deleteWorksheet(id: string): SavedWorksheet[] {
  const next = loadWorksheets().filter((item) => item.id !== id);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function updateWorksheet(
  id: string,
  entry: Omit<SavedWorksheet, "id" | "createdAt">,
): SavedWorksheet {
  const all = loadWorksheets();
  const index = all.findIndex((item) => item.id === id);
  if (index === -1) return saveWorksheet(entry);
  const next: SavedWorksheet = { ...all[index], ...entry };
  all[index] = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
  return next;
}

const EDIT_KEY = "lotagent.worksheet.edit.v1";
const EDITING_KEY = "lotagent.worksheet.editing.v1";

export function queueWorksheetEdit(id: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(EDIT_KEY, id);
  window.sessionStorage.removeItem(EDITING_KEY);
}

export function takeQueuedEdit(): string | null {
  if (typeof window === "undefined") return null;
  const queued = window.sessionStorage.getItem(EDIT_KEY);
  if (queued) {
    window.sessionStorage.setItem(EDITING_KEY, queued);
    window.sessionStorage.removeItem(EDIT_KEY);
    return queued;
  }
  return window.sessionStorage.getItem(EDITING_KEY);
}

export function clearWorksheetEdit() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(EDIT_KEY);
  window.sessionStorage.removeItem(EDITING_KEY);
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
