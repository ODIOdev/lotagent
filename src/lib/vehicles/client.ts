import { catalogPhoto, catalogPhotoPath, tokensMatch } from "@/lib/vehicles/photo";
import type { DecodedVehicle, VehicleLookup, VehicleRecall } from "@/lib/vehicles/types";
import { bandsFromRetail } from "@/lib/vehicles/values";
import { isVin, normalizeVin } from "@/lib/vehicles/vin";

const BASE = process.env.VEHICLES_API_BASE_URL ?? "https://api.vehicles.dev";

function apiKey() {
  return process.env.VEHICLES_API_KEY || process.env.VIN_PROVIDER_API_KEY || "";
}

function problemDetail(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "detail" in data && typeof (data as { detail: unknown }).detail === "string") {
    return (data as { detail: string }).detail;
  }
  return fallback;
}

async function vehiclesGet<T>(path: string): Promise<T> {
  const key = apiKey();
  if (!key) {
    const error = new Error("Add a Vehicles.dev vdev_ API key to .env.local as VEHICLES_API_KEY.");
    (error as Error & { status: number }).status = 503;
    throw error;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(problemDetail(data, "Vehicle lookup failed."));
    (error as Error & { status: number }).status = res.status;
    throw error;
  }
  return data as T;
}

export async function getMarketValue(input: {
  make: string;
  model: string;
  year: string;
  miles?: string;
  trim?: string;
}) {
  const params = new URLSearchParams({
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year.trim(),
    miles: input.miles?.replace(/\D/g, "") || "0",
  });
  if (input.trim?.trim()) params.set("trim", input.trim.trim());

  return vehiclesGet<{ estimateUsd?: number; medianApePct?: number; currency?: string }>(
    `/v1/vehicles/market-value?${params}`,
  );
}

interface ListingRow {
  year?: number;
  make?: string;
  model?: string;
  price?: number;
  miles?: number | null;
  vin?: string;
  primaryImage?: string | null;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function estimateFromListings(rows: ListingRow[], year: number, miles: number, model: string) {
  const priced = rows.filter((row) => typeof row.price === "number" && row.price > 0);
  if (!priced.length) return null;

  const tokens = model.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = priced
    .map((row) => {
      const listing = (row.model ?? "").toLowerCase();
      const hits = tokens.filter((token) => listing.includes(token)).length;
      return { row, hits };
    })
    .sort((a, b) => b.hits - a.hits);
  const best = scored[0]?.hits ?? 0;
  const pool = (best > 0 ? scored.filter((item) => item.hits === best) : scored).map((item) => item.row);
  const sameYear = pool.filter((row) => row.year === year);
  const used = sameYear.length >= 2 ? sameYear : pool;

  let estimate = median(used.map((row) => row.price as number));
  const avgYear = used.reduce((sum, row) => sum + (row.year || year), 0) / used.length;
  const yearDelta = avgYear - year;
  if (yearDelta > 0) estimate *= 0.88 ** yearDelta;
  if (yearDelta < 0) estimate *= 1.12 ** -yearDelta;

  const mileRows = used.filter((row) => typeof row.miles === "number");
  if (mileRows.length && miles > 0) {
    const avgMiles = mileRows.reduce((sum, row) => sum + (row.miles as number), 0) / mileRows.length;
    estimate -= (miles - avgMiles) * 0.1;
  }

  return Math.max(1500, Math.round(estimate / 50) * 50);
}

async function listingsEstimate(input: {
  make: string;
  model: string;
  year: string;
  miles?: string;
}): Promise<VehicleLookup["market"] | undefined> {
  const year = Number(input.year);
  const miles = Number(input.miles?.replace(/\D/g, "") || 0);
  const searches = [
    new URLSearchParams({ make: input.make, model: input.model, limit: "50", sort: "price" }),
    new URLSearchParams({ make: input.make, limit: "50", sort: "price" }),
  ];

  for (const params of searches) {
    try {
      const data = await vehiclesGet<{ results?: ListingRow[] }>(`/v1/vehicles/listings?${params}`);
      const estimateUsd = estimateFromListings(data.results ?? [], year, miles, input.model);
      if (estimateUsd) {
        return { currency: "USD", ...bandsFromRetail(estimateUsd), source: "listings" };
      }
    } catch {
      // try the next, broader search
    }
  }
  return undefined;
}

async function listingPhoto(input: { make: string; model: string; year: string }): Promise<string | undefined> {
  const year = Number(input.year);
  const searches = [
    new URLSearchParams({
      make: input.make,
      model: input.model,
      limit: "12",
      sort: "price",
      year_min: input.year,
      year_max: input.year,
    }),
    new URLSearchParams({ make: input.make, model: input.model, limit: "12", sort: "price" }),
  ];

  for (const params of searches) {
    try {
      const data = await vehiclesGet<{ results?: ListingRow[] }>(`/v1/vehicles/listings?${params}`);
      const photos = (data.results ?? []).filter(
        (row) => row.primaryImage && tokensMatch(input.model, `${row.year ?? ""} ${row.make ?? ""} ${row.model ?? ""}`),
      );
      if (!photos.length) continue;
      const sameYear = photos.filter((row) => row.year === year);
      return (sameYear[0] ?? photos[0])?.primaryImage ?? undefined;
    } catch {
      // try the broader search
    }
  }
  return undefined;
}

async function vinPhoto(vin: string): Promise<string | undefined> {
  try {
    const data = await vehiclesGet<{ primaryImage?: string; photos?: string[] }>(`/v1/vehicles/photos/${vin}`);
    return data.primaryImage || data.photos?.[0];
  } catch {
    return undefined;
  }
}

function pricedMarket(
  estimateUsd: number | undefined,
  extra: Omit<NonNullable<VehicleLookup["market"]>, "tradeInUsd" | "wholesaleUsd" | "retailUsd" | "estimateUsd">,
): VehicleLookup["market"] | undefined {
  if (estimateUsd == null || !Number.isFinite(estimateUsd) || estimateUsd <= 0) return undefined;
  return { ...extra, ...bandsFromRetail(estimateUsd) };
}

async function depreciationEstimate(input: {
  make: string;
  model: string;
  year: string;
  miles?: string;
}): Promise<VehicleLookup["market"] | undefined> {
  try {
    const data = await vehiclesGet<{
      byModelYear?: { year?: number; median_price?: number; age?: number }[];
    }>(`/v1/vehicles/depreciation?make=${encodeURIComponent(input.make)}&model=${encodeURIComponent(input.model)}`);
    const rows = data.byModelYear ?? [];
    const year = Number(input.year);
    const exact = rows.find((row) => row.year === year);
    const row =
      exact ??
      [...rows].sort((a, b) => Math.abs((a.year ?? 0) - year) - Math.abs((b.year ?? 0) - year))[0];
    if (!row?.median_price) return undefined;

    let retail = row.median_price;
    const miles = Number(input.miles?.replace(/\D/g, "") || 0);
    const typical = Math.max(1, row.age ?? Math.max(0, new Date().getFullYear() - year)) * 12000;
    if (miles > 0) retail -= (miles - typical) * 0.1;
    return pricedMarket(retail, { currency: "USD", source: "depreciation" });
  } catch {
    return undefined;
  }
}

async function marketValueSafe(input: {
  make: string;
  model: string;
  year: string;
  miles?: string;
  trim?: string;
}): Promise<{ market?: VehicleLookup["market"]; marketError?: string }> {
  try {
    const market = await getMarketValue(input);
    const priced = pricedMarket(market.estimateUsd, {
      currency: market.currency,
      medianApePct: market.medianApePct,
      source: "model",
    });
    if (priced) return { market: priced };
  } catch {
    if (input.trim) {
      try {
        const market = await getMarketValue({ ...input, trim: undefined });
        const priced = pricedMarket(market.estimateUsd, {
          currency: market.currency,
          medianApePct: market.medianApePct,
          source: "model",
        });
        if (priced) return { market: priced };
      } catch {
        // try depreciation, then listings
      }
    }
  }

  const [fromDepreciation, fromListings] = await Promise.all([
    depreciationEstimate(input),
    listingsEstimate(input),
  ]);
  if (fromDepreciation) return { market: fromDepreciation };
  if (fromListings) return { market: fromListings };
  return { marketError: "No market values for this vehicle." };
}

export async function lookupVehicle(input: {
  vin?: string;
  make?: string;
  model?: string;
  year?: string;
  miles?: string;
  trim?: string;
}): Promise<VehicleLookup> {
  const vin = input.vin ? normalizeVin(input.vin) : "";
  const make = input.make?.trim() ?? "";
  const model = input.model?.trim() ?? "";
  const year = input.year?.trim() ?? "";
  const miles = input.miles?.replace(/\D/g, "") ?? "";
  const trim = input.trim?.trim() ?? "";

  if (vin && !isVin(vin)) {
    const error = new Error("Enter a valid 17-character VIN.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }

  if (vin) {
    const decoded = await vehiclesGet<{ vehicle?: DecodedVehicle; vin?: string }>(`/v1/vehicles/vin/${vin}`);
    const vehicle = decoded.vehicle ?? {};
    const marketMake = vehicle.make || make;
    const marketModel = vehicle.model || model;
    const marketYear = vehicle.year ? String(vehicle.year) : year;

    const [specs, recalls, priced, photoUrl] = await Promise.all([
      vehiclesGet<{ specifications?: Record<string, string> }>(`/v1/vehicles/specifications/${vin}`).catch(() => null),
      vehiclesGet<{ count?: number; recalls?: VehicleRecall[] }>(`/v1/vehicles/recalls/${vin}`).catch(() => null),
      marketMake && marketModel && marketYear
        ? marketValueSafe({
            make: marketMake,
            model: marketModel,
            year: marketYear,
            miles,
            trim: vehicle.trim || trim,
          })
        : Promise.resolve({
            market: undefined,
            marketError: "Decoded VIN is missing make, model, or year.",
          }),
      marketMake && marketModel && marketYear
        ? catalogPhoto({ make: marketMake, model: marketModel, year: marketYear }).then(async (url) =>
            url?.includes("imagin.studio")
              ? catalogPhotoPath({ make: marketMake, model: marketModel, year: marketYear })
              : url ?? vinPhoto(vin),
          )
        : vinPhoto(vin),
    ]);

    return {
      vin: decoded.vin ?? vin,
      vehicle,
      specifications: specs?.specifications,
      market: priced.market,
      marketError: priced.marketError,
      photoUrl,
      recalls: recalls
        ? { count: recalls.count ?? recalls.recalls?.length ?? 0, items: recalls.recalls ?? [] }
        : undefined,
    };
  }

  if (!make || !model || !year) {
    const error = new Error("Choose a brand, model, and year — or enter a VIN.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }

  const [priced, photoUrl] = await Promise.all([
    marketValueSafe({ make, model, year, miles, trim }),
    catalogPhoto({ make, model, year }).then(async (url) =>
      url?.includes("imagin.studio")
        ? catalogPhotoPath({ make, model, year })
        : url ?? listingPhoto({ make, model, year }),
    ),
  ]);

  return {
    vehicle: { make, model, year: Number(year) },
    market: priced.market,
    marketError: priced.marketError,
    photoUrl,
  };
}
