import { NextRequest, NextResponse } from "next/server";
import { lookupVehicle } from "@/lib/vehicles/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    const result = await lookupVehicle({
      vin: params.get("vin") ?? undefined,
      make: params.get("make") ?? undefined,
      model: params.get("model") ?? undefined,
      year: params.get("year") ?? undefined,
      miles: params.get("miles") ?? undefined,
      trim: params.get("trim") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const status =
      typeof error === "object" && error && "status" in error
        ? Number((error as { status: number }).status)
        : 502;
    const message = error instanceof Error ? error.message : "Vehicle lookup failed.";
    return NextResponse.json({ error: message }, { status: Number.isFinite(status) ? status : 502 });
  }
}
