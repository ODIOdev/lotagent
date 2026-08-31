export const ZIP_DIGITS = /^\d{5}$/;

export function normalizeZip(value: string): string {
  return value.replace(/\D/g, "").slice(0, 5);
}

export function isZip(value: string): boolean {
  return ZIP_DIGITS.test(value);
}

/** Great-circle miles. Earth radius in statute miles. */
export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthMiles = 3958.7613;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthMiles * c);
}

export interface ZipPlace {
  zip: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface ZipDistance {
  from: ZipPlace;
  to: ZipPlace;
  miles: number;
}
