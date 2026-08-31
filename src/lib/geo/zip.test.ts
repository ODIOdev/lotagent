import { describe, expect, it } from "vitest";
import { haversineMiles, isZip, normalizeZip } from "@/lib/geo/zip";

describe("normalizeZip", () => {
  it("keeps the first five digits", () => {
    expect(normalizeZip("17545-1234")).toBe("17545");
    expect(normalizeZip(" 33-166 ")).toBe("33166");
  });
});

describe("isZip", () => {
  it("accepts only five digits", () => {
    expect(isZip("17545")).toBe(true);
    expect(isZip("3316")).toBe(false);
    expect(isZip("abcde")).toBe(false);
  });
});

describe("haversineMiles", () => {
  it("returns 0 for the same point", () => {
    expect(haversineMiles(40.1637, -76.3955, 40.1637, -76.3955)).toBe(0);
  });

  it("measures Manheim PA to Miami FL", () => {
    const miles = haversineMiles(40.1637, -76.3955, 25.7907, -80.13);
    expect(miles).toBeGreaterThan(980);
    expect(miles).toBeLessThan(1120);
  });
});
