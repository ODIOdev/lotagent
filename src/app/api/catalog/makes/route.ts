import { catalogMakes } from "@/lib/data/vehicle-catalog";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ makes: catalogMakes() });
}
