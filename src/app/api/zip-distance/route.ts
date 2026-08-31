import { NextRequest, NextResponse } from "next/server";
import { lookupZipDistance } from "@/lib/geo/lookup-zip";
import { normalizeZip } from "@/lib/geo/zip";

export async function GET(request: NextRequest) {
  const from = normalizeZip(request.nextUrl.searchParams.get("from") ?? "");
  const to = normalizeZip(request.nextUrl.searchParams.get("to") ?? "");

  try {
    const distance = await lookupZipDistance(from, to);
    return NextResponse.json(distance);
  } catch (error) {
    const status =
      typeof error === "object" && error && "status" in error
        ? Number((error as { status: number }).status)
        : 502;
    const message = error instanceof Error ? error.message : "ZIP lookup failed.";
    return NextResponse.json({ error: message }, { status: Number.isFinite(status) ? status : 502 });
  }
}
