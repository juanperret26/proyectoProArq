import { describe, expect, it } from "vitest";

import { countryName, formatQuantity, formatUsd } from "./format";

describe("formatUsd", () => {
  it("shows cents for small prices", () => {
    expect(formatUsd("en", 7.48)).toBe("$7.48");
  });

  it("drops cents for prices of 100 or more", () => {
    expect(formatUsd("en", 1250)).toBe("$1,250");
  });
});

describe("formatQuantity", () => {
  it("uses the locale's thousands separator", () => {
    expect(formatQuantity("en", 16000)).toBe("16,000");
  });
});

describe("countryName", () => {
  it("translates the country code to the active language", () => {
    expect(countryName("en", "IN")).toBe("India");
    expect(countryName("es", "VN")).toBe("Vietnam");
  });

  it("falls back to the code when it is not a valid region", () => {
    expect(countryName("en", "not-a-region")).toBe("not-a-region");
  });
});
