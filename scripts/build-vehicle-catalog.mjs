/**
 * Build brand → model → trim catalog from public NHTSA vPIC + Vehicles.dev listings.
 * Does not scrape AutoTempest.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/lib/data/vehicle-catalog.json");
const REFRESH_LISTINGS = process.argv.includes("--refresh-listings");

const US_MAKES = new Set(
  [
    "acura", "alfaromeo", "amc", "americanmotors", "astonmartin", "audi", "austin",
    "austinhealey", "bentley", "bmw", "bugatti", "buick", "cadillac", "chevrolet",
    "chrysler", "daewoo", "datsun", "delorean", "dodge", "eagle", "ferrari", "fiat",
    "fisker", "ford", "genesis", "geo", "gmc", "honda", "hummer", "hyundai", "ineos",
    "infiniti", "isuzu", "jaguar", "jeep", "karma", "kia", "lamborghini", "landrover",
    "lexus", "lincoln", "lotus", "lucid", "maserati", "maybach", "mazda", "mclaren",
    "mercedes", "mercedesbenz", "mercury", "mg", "mini", "mitsubishi", "nissan",
    "oldsmobile", "panoz", "plymouth", "polestar", "pontiac", "porsche", "ram",
    "rivian", "rollsroyce", "saab", "saturn", "scion", "smart", "subaru", "suzuki",
    "tesla", "toyota", "triumph", "vinfast", "volkswagen", "volvo",
  ],
);

const ALIAS = {
  chevy: "chevrolet",
  chev: "chevrolet",
  vw: "volkswagen",
  benz: "mercedesbenz",
  mercedesbenz: "mercedesbenz",
  rolls: "rollsroyce",
  rover: "landrover",
  range: "landrover",
};

const DISPLAY = {
  amc: "AMC",
  bmw: "BMW",
  gmc: "GMC",
  mini: "MINI",
  "mercedes-benz": "Mercedes-Benz",
  "rolls-royce": "Rolls-Royce",
  mclaren: "McLaren",
  "land rover": "Land Rover",
  "alfa romeo": "Alfa Romeo",
  "aston martin": "Aston Martin",
  "american motors": "American Motors",
  "austin-healey": "Austin-Healey",
};

const SKIP_MAKE = /trailer|aluminum|radiator|custom|inc\.|llc|corp|chassis|coach|kit|limousine|hearse/i;
const SKIP_MODEL =
  /trailer|aluminum|radiator|chassis|kit car|limousine|incomplete|cutaway|cab.?chassis|stripped|school bus|step van|motorhome|motorcycle|lsv\b|inc\.|llc|ltd|co\.,/i;
const TYPES = ["passenger car", "truck", "multipurpose passenger vehicle"];

function norm(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isUsRetailMake(name) {
  return US_MAKES.has(ALIAS[norm(name)] ?? norm(name));
}

function titleCase(name) {
  return name.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

function labelMake(name) {
  const titled = titleCase(name.trim());
  return DISPLAY[titled.toLowerCase()] ?? titled;
}

function isJunkModel(name) {
  const value = name.trim();
  if (!value || SKIP_MODEL.test(value)) return true;
  if (/^\d{2,}["”]?\s*WB/i.test(value)) return true;
  if (/^[''‘’]\d{2}$/.test(value)) return true;
  if (/^[A-Z]{1,2}T?\d{4,}$/i.test(value)) return true;
  if (/^(B|C|P|L|LN|LNT|LT|LTA|LTL|LTLA|LTLS|LTS|LLA|LLS|FT|CT)\s?-?\d{3,}/i.test(value)) return true;
  if (/recreational vehicle/i.test(value)) return true;
  if (/sedan$/i.test(value) && /classic|cordova|malibu/i.test(value)) return true;
  return false;
}

function key() {
  return process.env.VEHICLES_API_KEY || "";
}

async function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^VEHICLES_API_KEY=(.*)$/);
      if (match) process.env.VEHICLES_API_KEY = match[1].trim();
    }
  } catch {
    // optional
  }
}

function loadPreviousTrims() {
  if (!existsSync(OUT)) return {};
  try {
    const prev = JSON.parse(readFileSync(OUT, "utf8"));
    const bag = {};
    for (const [brand, entry] of Object.entries(prev.catalog ?? {})) {
      const brandKey = norm(brand);
      if (!bag[brandKey]) bag[brandKey] = {};
      for (const [model, trims] of Object.entries(entry.trims ?? {})) {
        if (!trims?.length) continue;
        const modelKey = norm(model);
        if (!bag[brandKey][modelKey]) bag[brandKey][modelKey] = { label: model, values: new Set() };
        for (const trim of trims) bag[brandKey][modelKey].values.add(trim);
      }
    }
    return bag;
  } catch {
    return {};
  }
}

async function json(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function pool(items, size, worker) {
  const out = [];
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (index < items.length) {
        const current = items[index++];
        out.push(await worker(current));
      }
    }),
  );
  return out;
}

async function fetchMakes() {
  const byName = new Map();
  await Promise.all(
    TYPES.map(async (type) => {
      const data = await json(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/${encodeURIComponent(type)}?format=json`,
      );
      for (const row of data.Results ?? []) {
        const name = (row.MakeName ?? row.Make_Name ?? "").trim();
        const id = row.MakeId ?? row.Make_ID;
        if (!name || !id || SKIP_MAKE.test(name) || !isUsRetailMake(name)) continue;
        const label = labelMake(name);
        const current = byName.get(label);
        if (!current || id < current.id) byName.set(label, { id, nhtsa: name });
      }
    }),
  );
  return [...byName.entries()]
    .map(([name, meta]) => ({ name, ...meta }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchModels(make) {
  const names = new Set();
  await Promise.all(
    TYPES.map(async (type) => {
      try {
        const data = await json(
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make.nhtsa)}/vehicleType/${encodeURIComponent(type)}?format=json`,
        );
        for (const row of data.Results ?? []) {
          const name = (row.Model_Name ?? row.ModelName ?? "").trim();
          if (name && !isJunkModel(name)) names.add(name);
        }
      } catch {
        // skip this type
      }
    }),
  );
  return [...names].sort((a, b) => a.localeCompare(b));
}

async function fetchListingTrims(makeName) {
  const token = key();
  if (!token) return [];
  const base = process.env.VEHICLES_API_BASE_URL || "https://api.vehicles.dev";
  const rows = [];
  for (const offset of [0, 500]) {
    const params = new URLSearchParams({
      make: makeName,
      limit: "500",
      offset: String(offset),
      sort: "price",
    });
    try {
      const data = await json(`${base}/v1/vehicles/listings?${params}`, {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      });
      rows.push(...(data.results ?? []));
      if ((data.total ?? 0) <= offset + 500) break;
    } catch {
      break;
    }
  }
  return rows;
}

function addTrim(bag, model, trim) {
  const name = (model ?? "").trim();
  const value = (trim ?? "").trim();
  if (!name || !value || /^(none|n\/?a|unknown|null)$/i.test(value)) return;
  const modelKey = norm(name);
  if (!bag[modelKey]) bag[modelKey] = { label: name, values: new Set() };
  bag[modelKey].values.add(value);
}

function relatedModel(a, b) {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left === right) return true;
  return (
    left.startsWith(`${right} `) ||
    left.startsWith(`${right}-`) ||
    right.startsWith(`${left} `) ||
    right.startsWith(`${left}-`)
  );
}

function attachTrims(models, bags) {
  const trims = {};
  for (const model of models) {
    const found = new Set();
    for (const bag of bags) {
      for (const hit of Object.values(bag)) {
        if (!hit?.label) continue;
        if (relatedModel(model, hit.label) || norm(model) === norm(hit.label)) {
          for (const value of hit.values) found.add(value);
        }
      }
    }
    trims[model] = [...found].sort((a, b) => a.localeCompare(b));
  }
  return trims;
}

await loadEnv();
const previous = loadPreviousTrims();
console.log("Fetching NHTSA makes…");
const makes = await fetchMakes();
console.log(`${makes.length} brands`);

const catalog = {};
await pool(makes, 4, async (make) => {
  const models = await fetchModels(make);
  const listingBag = {};
  const reusedBag = previous[norm(make.name)] ?? {};

  const needListings = REFRESH_LISTINGS || !Object.keys(reusedBag).length;
  if (needListings) {
    const listings = await fetchListingTrims(make.name);
    for (const row of listings) {
      addTrim(listingBag, row.model, row.trim);
      if (row.model && !isJunkModel(row.model) && !models.some((item) => norm(item) === norm(row.model))) {
        models.push(row.model);
      }
    }
  }

  for (const hit of Object.values(reusedBag)) {
    if (hit.label && !isJunkModel(hit.label) && !models.some((item) => norm(item) === norm(hit.label))) {
      models.push(hit.label);
    }
  }
  models.sort((a, b) => a.localeCompare(b));

  const trims = attachTrims(models, [reusedBag, listingBag]);
  const withTrims = Object.values(trims).filter((list) => list.length).length;
  catalog[make.name] = { id: make.id, models, trims };
  console.log(`${make.name}: ${models.length} models, ${withTrims} with trims`);
});

const payload = {
  generatedAt: new Date().toISOString(),
  source: ["nhtsa.vpic.vehicleType", "vehicles.dev/listings"],
  brands: Object.keys(catalog).sort((a, b) => a.localeCompare(b)),
  catalog,
};

writeFileSync(OUT, `${JSON.stringify(payload)}\n`);
console.log(`Wrote ${OUT} (${payload.brands.length} brands)`);
