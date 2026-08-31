import { haversineMiles, isZip, type ZipDistance, type ZipPlace } from "@/lib/geo/zip";

interface ZippopotamPlace {
  "place name": string;
  latitude: string;
  longitude: string;
  "state abbreviation": string;
  state: string;
}

interface ZippopotamResponse {
  "post code": string;
  places?: ZippopotamPlace[];
}

const placeCache = new Map<string, ZipPlace>();

async function lookupPlace(zip: string): Promise<ZipPlace> {
  const cached = placeCache.get(zip);
  if (cached) return cached;

  const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  });

  if (res.status === 404) {
    throw Object.assign(new Error(`ZIP ${zip} was not found.`), { status: 404 });
  }
  if (!res.ok) {
    throw Object.assign(new Error("ZIP lookup failed."), { status: 502 });
  }

  const data = (await res.json()) as ZippopotamResponse;
  const place = data.places?.[0];
  if (!place) {
    throw Object.assign(new Error(`ZIP ${zip} was not found.`), { status: 404 });
  }

  const result: ZipPlace = {
    zip,
    city: place["place name"],
    state: place["state abbreviation"] || place.state,
    lat: Number(place.latitude),
    lng: Number(place.longitude),
  };
  if (!Number.isFinite(result.lat) || !Number.isFinite(result.lng)) {
    throw Object.assign(new Error("ZIP lookup returned invalid coordinates."), { status: 502 });
  }
  placeCache.set(zip, result);
  return result;
}

export async function lookupZipDistance(fromZip: string, toZip: string): Promise<ZipDistance> {
  if (!isZip(fromZip) || !isZip(toZip)) {
    throw Object.assign(new Error("Enter two 5-digit ZIP codes."), { status: 400 });
  }

  const [from, to] = await Promise.all([lookupPlace(fromZip), lookupPlace(toZip)]);
  return {
    from,
    to,
    miles: haversineMiles(from.lat, from.lng, to.lat, to.lng),
  };
}
