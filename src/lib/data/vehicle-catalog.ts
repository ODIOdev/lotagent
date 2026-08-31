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
