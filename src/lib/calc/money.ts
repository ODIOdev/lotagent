/** Coerce any user input into a safe non-negative number. Never returns NaN. */
export function moneyNum(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const n =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[$,%\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function roundMoney(value: number): number {
  const n = Number.isFinite(value) ? value : 0;
  return Math.round(n * 100) / 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
