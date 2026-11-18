import { describe, expect, it } from "vitest";

import {
  countryName,
  formatQuantity,
  formatUsd,
  quantityWithUnit,
  type QuantityTranslator,
} from "./format";

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

/** Traductor falso: conoce solo "bag" y arma el plural como lo haría ICU. */
const translator: QuantityTranslator = Object.assign(
  (key: string, values: { count: number }) =>
    key === "quantityUnits.bag"
      ? `${values.count} ${values.count === 1 ? "bag" : "bags"}`
      : "unexpected",
  { has: (key: string) => key === "quantityUnits.bag" },
);

describe("quantityWithUnit", () => {
  it("uses the translated singular or plural form for known units", () => {
    expect(quantityWithUnit(translator, "bag", 1, "en")).toBe("1 bag");
    expect(quantityWithUnit(translator, "bag", 200, "en")).toBe("200 bags");
  });

  it("falls back to the formatted number and the raw unit code for unknown units", () => {
    expect(quantityWithUnit(translator, "drum", 1500, "en")).toBe("1,500 drum");
  });
});
