import data from "./vehicle-catalog.json";

type CatalogEntry = {
  id: number;
  models: string[];
  trims: Record<string, string[]>;
};

type CatalogFile = {
  generatedAt: string;
  source: string[];
  brands: string[];
  catalog: Record<string, CatalogEntry>;
};

const FILE = data as CatalogFile;
const CATALOG = FILE.catalog;

function sameName(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

function findBrand(brand: string): CatalogEntry | undefined {
  if (CATALOG[brand]) return CATALOG[brand];
  const key = FILE.brands.find((name) => sameName(name, brand));
  return key ? CATALOG[key] : undefined;
}

function findModelKey(entry: CatalogEntry, model: string): string | undefined {
  if (entry.trims[model]) return model;
  return entry.models.find((name) => sameName(name, model))
    ?? Object.keys(entry.trims).find((name) => sameName(name, model));
}

export const VEHICLE_BRANDS = FILE.brands;

export function catalogMakes(): { id: number; name: string }[] {
  return FILE.brands.map((name) => ({ id: CATALOG[name]?.id ?? 0, name }));
}

export function vehicleYears(): string[] {
  const newest = new Date().getFullYear() + 1;
  return Array.from({ length: newest - 1989 }, (_, index) => String(newest - index));
}

export function modelsForBrand(brand: string): string[] {
  return findBrand(brand)?.models ?? [];
}

export type VehicleSearchHit = {
  kind: "brand" | "model";
  brand: string;
  model?: string;
  label: string;
};

const BRAND_INDEX: { kind: "brand"; brand: string; label: string; hay: string }[] = FILE.brands.map(
  (brand) => ({ kind: "brand", brand, label: brand, hay: brand.toLowerCase() }),
);

const MODEL_INDEX: { kind: "model"; brand: string; model: string; label: string; hay: string; modelHay: string }[] =
  FILE.brands.flatMap((brand) =>
    (CATALOG[brand]?.models ?? []).map((model) => ({
      kind: "model" as const,
      brand,
      model,
      label: `${brand} ${model}`,
      hay: `${brand} ${model}`.toLowerCase(),
      modelHay: model.toLowerCase(),
    })),
  );

export function searchCatalog(query: string, limit = 8): VehicleSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  const scored: { hit: VehicleSearchHit; score: number }[] = [];
  for (const item of BRAND_INDEX) {
    if (item.hay.startsWith(q)) scored.push({ hit: item, score: 0 });
    else if (item.hay.includes(q)) scored.push({ hit: item, score: 2 });
  }
  for (const item of MODEL_INDEX) {
    if (item.modelHay.startsWith(q) || item.hay.startsWith(q)) scored.push({ hit: item, score: 1 });
    else if (item.modelHay.includes(q) || item.hay.includes(q)) scored.push({ hit: item, score: 3 });
  }

  scored.sort((a, b) => a.score - b.score || a.hit.label.localeCompare(b.hit.label));
  const seen = new Set<string>();
  const hits: VehicleSearchHit[] = [];
  for (const row of scored) {
    const key = row.hit.kind === "brand" ? `b:${row.hit.brand}` : `m:${row.hit.brand}:${row.hit.model}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push(row.hit);
    if (hits.length >= limit) break;
  }
  return hits;
}

export function trimsForModel(brand: string, model: string): string[] {
  const entry = findBrand(brand);
  if (!entry || !model) return [];
  const key = findModelKey(entry, model);
  return key ? (entry.trims[key] ?? []) : [];
}

export function matchCatalogName(value: string, options: readonly string[]): string {
  const found = options.find((item) => sameName(item, value));
  return found ?? value;
}

export function catalogMeta() {
  return { generatedAt: FILE.generatedAt, source: FILE.source, brands: FILE.brands.length };
}
