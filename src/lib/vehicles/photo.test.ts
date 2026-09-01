import { describe, expect, it } from "vitest";
import { modelSlug, photoTokens, tokensMatch } from "@/lib/vehicles/photo";

describe("photoTokens", () => {
  it("keeps model words and drops a lone E", () => {
    expect(photoTokens("Mustang Mach-E")).toEqual(["mustang", "mach"]);
  });

  it("keeps digits in Model 3 and F-150", () => {
    expect(photoTokens("Model 3")).toEqual(["model", "3"]);
    expect(photoTokens("F-150")).toEqual(["150"]);
  });
});

describe("tokensMatch", () => {
  it("accepts the Mach-E catalog title and rejects a regular Mustang", () => {
    expect(tokensMatch("Mustang Mach-E", "Ford Mustang Mach-E")).toBe(true);
    expect(tokensMatch("Mustang Mach-E", '{"modelRange":"mustang-mach-e"}')).toBe(true);
    expect(tokensMatch("Mustang Mach-E", "Ford Mustang")).toBe(false);
  });
});

describe("modelSlug", () => {
  it("slugs common catalog names", () => {
    expect(modelSlug("Mustang Mach-E")).toBe("mustang-mach-e");
    expect(modelSlug("F-150")).toBe("f-150");
    expect(modelSlug("C-Class")).toBe("c-class");
  });
});
