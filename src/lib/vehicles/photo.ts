const WIKI_UA = "LOTAGENT/1.0 (https://lotagent.vercel.app; catalog-photos)";
const IMAGIN_CUSTOMER = process.env.IMAGIN_CUSTOMER || "img";

export function photoTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 || /\d/.test(token));
}

export function tokensMatch(model: string, haystack: string) {
  const needed = photoTokens(model);
  if (!needed.length) return false;
  const hay = haystack.toLowerCase();
  return needed.every((token) => hay.includes(token));
}

export function modelSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function imaginUrl(make: string, model: string, year: string) {
  const params = new URLSearchParams({
    customer: IMAGIN_CUSTOMER,
    make: modelSlug(make) || make.toLowerCase(),
    modelFamily: modelSlug(model) || model.toLowerCase(),
    modelYear: year,
    zoomType: "fullscreen",
    angle: "23",
    countryCode: "us",
    width: "800",
  });
  return `https://cdn.imagin.studio/getimage?${params}`;
}

async function imaginPhoto(input: { make: string; model: string; year: string }) {
  const url = imaginUrl(input.make, input.model, input.year);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { Accept: "image/*" },
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return undefined;
    if (res.headers.get("x-imaginstudio-request-found") !== "true") return undefined;
    const resolved = res.headers.get("x-imaginstudio-request-resolved-to") ?? "";
    if (!tokensMatch(input.model, resolved)) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

interface WikiPage {
  title?: string;
  original?: { source?: string };
}

async function wikipediaPhoto(input: { make: string; model: string; year: string }) {
  const queries = [`${input.year} ${input.make} ${input.model}`, `${input.make} ${input.model}`];
  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        action: "query",
        format: "json",
        origin: "*",
        prop: "pageimages",
        piprop: "original",
        generator: "search",
        gsrsearch: query,
        gsrlimit: "8",
      });
      const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
        headers: { Accept: "application/json", "User-Agent": WIKI_UA },
        next: { revalidate: 86_400 },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { query?: { pages?: Record<string, WikiPage> } };
      const pages = Object.values(data.query?.pages ?? {});
      const hit = pages.find(
        (page) => page.original?.source && tokensMatch(input.model, page.title ?? ""),
      );
      if (hit?.original?.source) return hit.original.source;
    } catch {
      // try the shorter query
    }
  }
  return undefined;
}

export function catalogPhotoPath(input: { make: string; model: string; year: string }) {
  return `/api/vehicle-photo?${new URLSearchParams({
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year.trim(),
  })}`;
}

export async function catalogPhoto(input: {
  make: string;
  model: string;
  year: string;
}): Promise<string | undefined> {
  if (!input.make.trim() || !input.model.trim()) return undefined;
  return (await imaginPhoto(input)) ?? (await wikipediaPhoto(input));
}

export async function fetchCatalogImage(input: {
  make: string;
  model: string;
  year: string;
}): Promise<{ body: ReadableStream<Uint8Array>; contentType: string } | undefined> {
  const url = await catalogPhoto(input);
  if (!url) return undefined;
  const headers: HeadersInit = { Accept: "image/*" };
  if (url.includes("wikipedia.org") || url.includes("wikimedia.org")) {
    headers["User-Agent"] = WIKI_UA;
  }
  const res = await fetch(url, { headers, next: { revalidate: 86_400 } });
  if (!res.ok || !res.body) return undefined;
  return {
    body: res.body,
    contentType: res.headers.get("content-type") || "image/jpeg",
  };
}
