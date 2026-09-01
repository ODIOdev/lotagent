import { isZip, normalizeZip } from "@/lib/geo/zip";

const STORAGE_KEY = "lotagent.transport.defaults.v1";

export const DEFAULT_DELIVERY_ZIP = "17545";
export const DEFAULT_RATE = "1.35";
export const DEFAULT_PICKUP = "95";

export type TransportDefaults = {
  deliveryZip: string;
  rate: string;
  pickup: string;
};

function cleanRate(value: string): string {
  const next = value.replace(/[^\d.]/g, "");
  const dot = next.indexOf(".");
  if (dot === -1) return next;
  return `${next.slice(0, dot + 1)}${next.slice(dot + 1).replace(/\./g, "")}`;
}

export function emptyTransportDefaults(): TransportDefaults {
  return {
    deliveryZip: DEFAULT_DELIVERY_ZIP,
    rate: DEFAULT_RATE,
    pickup: DEFAULT_PICKUP,
  };
}

export function normalizeTransportDefaults(
  value: Partial<TransportDefaults> | null | undefined,
): TransportDefaults {
  const fallback = emptyTransportDefaults();
  const zip = normalizeZip(value?.deliveryZip ?? "");
  const rate = cleanRate(value?.rate ?? "");
  const pickup = cleanRate(value?.pickup ?? "");
  return {
    deliveryZip: isZip(zip) ? zip : fallback.deliveryZip,
    rate: rate || fallback.rate,
    pickup: pickup || fallback.pickup,
  };
}

export function loadTransportDefaults(): TransportDefaults {
  const fallback = emptyTransportDefaults();
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return fallback;
  try {
    return normalizeTransportDefaults(JSON.parse(raw) as Partial<TransportDefaults>);
  } catch {
    return fallback;
  }
}

export function writeTransportDefaults(next: TransportDefaults): TransportDefaults {
  const stored = normalizeTransportDefaults(next);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }
  return stored;
}
