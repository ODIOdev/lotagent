export function normalizeVin(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 17);
}

export function isVin(value: string) {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalizeVin(value));
}
