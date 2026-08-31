import { trimsForModel } from "@/lib/data/vehicle-catalog";
import { NextResponse } from "next/server";

const BASE = process.env.VEHICLES_API_BASE_URL ?? "https://api.vehicles.dev";

function apiKey() {
  return process.env.VEHICLES_API_KEY || process.env.VIN_PROVIDER_API_KEY || "";
}

function mergeTrims(...lists: string[][]) {
  return [...new Set(lists.flat().map((name) => name.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make")?.trim() ?? "";
  const model = searchParams.get("model")?.trim() ?? "";
  const year = searchParams.get("year")?.trim() ?? "";
  if (!make || !model) {
    return NextResponse.json({ trims: [] });
  }

  const catalog = trimsForModel(make, model);
  const key = apiKey();
  if (!key) return NextResponse.json({ trims: catalog, source: "catalog" });

  const params = new URLSearchParams({
    make,
    model,
    limit: "50",
    sort: "price",
  });
  if (year) {
    params.set("year_min", year);
    params.set("year_max", year);
  }

  const res = await fetch(`${BASE}/v1/vehicles/listings?${params}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ trims: catalog, source: "catalog" });

  const data = (await res.json()) as { results?: { trim?: string | null }[] };
  const live = (data.results ?? [])
    .map((row) => (row.trim ?? "").trim())
    .filter((name) => name.length > 0 && name.toLowerCase() !== "none");

  return NextResponse.json({
    trims: mergeTrims(catalog, live),
    source: live.length ? "catalog+listings" : "catalog",
  });
}
