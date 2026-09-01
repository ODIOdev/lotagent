import { NextRequest, NextResponse } from "next/server";
import { fetchCatalogImage } from "@/lib/vehicles/photo";

export async function GET(request: NextRequest) {
  const make = request.nextUrl.searchParams.get("make")?.trim() ?? "";
  const model = request.nextUrl.searchParams.get("model")?.trim() ?? "";
  const year = request.nextUrl.searchParams.get("year")?.trim() ?? "";

  if (!make || !model || !/^\d{4}$/.test(year)) {
    return NextResponse.json({ error: "Choose a brand, model, and year." }, { status: 400 });
  }

  try {
    const image = await fetchCatalogImage({ make, model, year });
    if (!image) {
      return NextResponse.json({ error: "No catalog photo for that vehicle." }, { status: 404 });
    }
    return new NextResponse(image.body, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Catalog photo failed." }, { status: 502 });
  }
}
