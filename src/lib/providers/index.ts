import type { VehicleInfo } from "@/lib/types";
import type {
  ComparableListing,
  HistoryReport,
  MileageResult,
  ProviderAdapters,
  TransportQuote,
  ValuationResult,
} from "@/lib/providers/types";

function zipDistance(fromZip: string, toZip: string): number {
  const a = Number(fromZip.replace(/\D/g, "").slice(0, 5)) || 0;
  const b = Number(toZip.replace(/\D/g, "").slice(0, 5)) || 0;
  const delta = Math.abs(a - b);
  return Math.max(8, Math.round(delta * 0.012 + 12));
}

export const mockProviders: ProviderAdapters = {
  async decodeVin(vin) {
    const cleaned = vin.replace(/\s/g, "").toUpperCase();
    return {
      vin: cleaned,
      year: 2020,
      make: "Demo",
      model: "Decoded",
      trim: "Mock adapter",
      source: "mock",
    };
  },

  async valuate(vehicle: VehicleInfo): Promise<ValuationResult> {
    const base = Math.max(4000, 42000 - vehicle.mileage * 0.12 - (2026 - vehicle.year) * 1800);
    const wholesale = Math.round(base / 50) * 50;
    return {
      tradeIn: Math.round(wholesale * 0.86),
      wholesale,
      retail: Math.round(wholesale * 1.18),
      quickSale: Math.round(wholesale * 0.94),
      localMarketAverage: Math.round(wholesale * 1.08),
      lowMarket: Math.round(wholesale * 0.9),
      highMarket: Math.round(wholesale * 1.25),
      source: "Demo valuation adapter",
      retrievedAt: new Date().toISOString(),
      confidence: 62,
      manualOverride: false,
      notes: "Mock values only. Connect a licensed provider — do not scrape KBB or similar services.",
      provider: "mock",
    };
  },

  async comparables(vehicle: VehicleInfo): Promise<ComparableListing[]> {
    const wholesale = 20000;
    return [12, 38, 54].map((distance, index) => ({
      id: `comp-${index}`,
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      price: wholesale + (index - 1) * 900,
      mileage: vehicle.mileage + (index - 1) * 4000,
      distanceMiles: distance,
      source: "Demo listings adapter",
    }));
  },

  async mileage(fromZip, toZip): Promise<MileageResult> {
    return { fromZip, toZip, miles: zipDistance(fromZip, toZip), source: "mock" };
  },

  async transportQuote(fromZip, toZip, inoperable): Promise<TransportQuote> {
    const miles = zipDistance(fromZip, toZip);
    return {
      carrier: "Demo Transport Co.",
      amount: Math.round(miles * 1.35 + 95 + (inoperable ? 250 : 0)),
      days: miles > 400 ? 5 : 2,
      source: "mock",
    };
  },

  async history(vin): Promise<HistoryReport> {
    return {
      vin,
      accidents: 0,
      owners: 1,
      titleBrands: [],
      source: "mock",
    };
  },
};

export function getProviders(): ProviderAdapters {
  return mockProviders;
}
