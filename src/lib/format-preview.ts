export type FormatMode = "iphone" | "ipad" | "desktop";
export type FormatOrient = "portrait" | "landscape";

export const FORMAT_STORAGE_KEY = "lotagent.dev.format";
export const FORMAT_ORIENT_KEY = "lotagent.dev.orient";
export const FORMAT_EVENT = "lotagent:format";
export const FORMAT_ORIENT_EVENT = "lotagent:orient";

/** True CSS-pixel sizes. iPhone 14/15 and iPad Air 11" portrait. */
export const FORMAT_SIZE = {
  iphone: { width: 390, height: 844, label: "iPhone", spec: "14 / 15 · 390×844" },
  ipad: { width: 834, height: 1194, label: "iPad", spec: "Air 11″ · 834×1194" },
  desktop: { width: 1440, height: 900, label: "Desktop", spec: "Full window" },
} as const;

export function formatFrameSize(mode: FormatMode, orient: FormatOrient) {
  const size = FORMAT_SIZE[mode];
  if (mode === "desktop" || orient === "portrait") {
    return { width: size.width, height: size.height };
  }
  return { width: size.height, height: size.width };
}

export function formatSpec(mode: FormatMode, orient: FormatOrient) {
  if (mode === "desktop") return FORMAT_SIZE.desktop.spec;
  const { width, height } = formatFrameSize(mode, orient);
  const base = mode === "iphone" ? "14 / 15" : "Air 11″";
  return `${base} · ${width}×${height}${orient === "landscape" ? " landscape" : ""}`;
}

export function formatPreviewAllowed() {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV) return false;
  if (process.env.VERCEL) return false;
  return process.env.NODE_ENV === "development";
}

export function parseFormatMode(value: string | null): FormatMode | null {
  if (value === "iphone" || value === "phone" || value === "1") return "iphone";
  if (value === "ipad" || value === "tablet") return "ipad";
  if (value === "desktop" || value === "0" || value === "false") return "desktop";
  return null;
}

export function writeFormatUrl(mode: FormatMode) {
  const url = new URL(window.location.href);
  if (mode === "desktop") url.searchParams.delete("format");
  else url.searchParams.set("format", mode);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function setFormatMode(mode: FormatMode) {
  if (typeof window === "undefined" || !formatPreviewAllowed()) return;
  window.sessionStorage.setItem(FORMAT_STORAGE_KEY, mode);
  writeFormatUrl(mode);
  window.dispatchEvent(new CustomEvent(FORMAT_EVENT, { detail: mode }));
}

export function parseFormatOrient(value: string | null): FormatOrient | null {
  if (value === "landscape" || value === "land") return "landscape";
  if (value === "portrait" || value === "port") return "portrait";
  return null;
}

export function setFormatOrient(orient: FormatOrient) {
  if (typeof window === "undefined" || !formatPreviewAllowed()) return;
  window.sessionStorage.setItem(FORMAT_ORIENT_KEY, orient);
  const url = new URL(window.location.href);
  if (orient === "portrait") url.searchParams.delete("orient");
  else url.searchParams.set("orient", "landscape");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new CustomEvent(FORMAT_ORIENT_EVENT, { detail: orient }));
}
