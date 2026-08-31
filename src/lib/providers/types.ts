import type { VehicleInfo, VehicleValues } from "@/lib/types";

export interface VinDecodeResult {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  source: "mock" | "provider";
}

export interface ValuationResult extends VehicleValues {
  provider: string;
}

export interface ComparableListing {
  id: string;
  title: string;
  price: number;
  mileage: number;
  distanceMiles: number;
  source: string;
}

export interface MileageResult {
  fromZip: string;
  toZip: string;
  miles: number;
  source: "mock" | "provider";
}

export interface TransportQuote {
  carrier: string;
  amount: number;
  days: number;
  source: "mock" | "provider";
}

export interface HistoryReport {
  vin: string;
  accidents: number;
  owners: number;
  titleBrands: string[];
  source: "mock";
}

export interface ProviderAdapters {
  decodeVin(vin: string): Promise<VinDecodeResult>;
  valuate(vehicle: VehicleInfo): Promise<ValuationResult>;
  comparables(vehicle: VehicleInfo): Promise<ComparableListing[]>;
  mileage(fromZip: string, toZip: string): Promise<MileageResult>;
  transportQuote(fromZip: string, toZip: string, inoperable: boolean): Promise<TransportQuote>;
  history(vin: string): Promise<HistoryReport>;
}
