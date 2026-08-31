import { catalogMakes, modelsForBrand } from "@/lib/data/vehicle-catalog";
import { isUsRetailMake } from "@/lib/data/us-catalog";
import { NextResponse } from "next/server";

const SKIP = /trailer|aluminum|radiator|chassis|kit car|limousine|incomplete|cutaway|cab.?chassis|stripped/i;

type ModelRow = { Model_Name?: string; ModelName?: string };

function brandName(makeId: string | null, make: string | null) {
  if (make) return make;
  if (!makeId) return "";
  const id = Number(makeId);
  return catalogMakes().find((item) => item.id === id)?.name ?? "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const makeId = searchParams.get("makeId");
  const make = searchParams.get("make");
  const year = searchParams.get("year");
  const brand = brandName(makeId, make);
  if (!makeId && !make) {
    return NextResponse.json({ error: "make required" }, { status: 400 });
  }
  if (brand && !isUsRetailMake(brand)) {
    return NextResponse.json({ models: [] });
  }

  const fallback = modelsForBrand(brand);
  if (!year) {
    return NextResponse.json({ models: fallback, source: "catalog" });
  }

  const url = makeId
    ? `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeIdYear/makeId/${encodeURIComponent(makeId)}/modelyear/${encodeURIComponent(year)}?format=json`
    : `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make!)}/modelyear/${encodeURIComponent(year)}?format=json`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return NextResponse.json({ models: fallback, source: "catalog" });

  const json = (await res.json()) as { Results?: ModelRow[] };
  const models = [
    ...new Set(
      (json.Results ?? [])
        .map((row) => row.Model_Name ?? row.ModelName ?? "")
        .filter((name) => name.length > 0 && !SKIP.test(name)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return NextResponse.json({
    models: models.length ? models : fallback,
    source: models.length ? "nhtsa" : "catalog",
  });
}
