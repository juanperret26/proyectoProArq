import { describe, expect, it } from "vitest";

import { MAX_QUERY_LENGTH, parseQuery } from "./parse";

describe("parseQuery", () => {
  it("reads material, quantity, unit, country and price priority in English", () => {
    const parsed = parseQuery("500 m2 of porcelain tile from Vietnam, cheapest please");

    expect(parsed).toMatchObject({
      categorySlugs: ["porcelain-tiles"],
      searchTerms: null,
      quantity: 500,
      unit: "m2",
      countries: ["VN"],
      priority: "price",
      confidence: "high",
    });
  });

  it("reads a Spanish request with thousands separator, urgency and an excluded country", () => {
    const parsed = parseQuery(
      "Necesito 1.000 bolsas de cemento portland, entrega urgente, que no sea de China",
    );

    expect(parsed.categorySlugs).toEqual(["portland-cement"]);
    expect(parsed.quantity).toBe(1000);
    expect(parsed.unit).toBe("bag");
    expect(parsed.priority).toBe("lead_time");
    expect(parsed.countries).toEqual(["IN", "TW", "TR", "VN"]);
  });

  it("reads budget per unit, certifications and verified suppliers", () => {
    const parsed = parseQuery("LED panels under $12 each, ISO 9001 and CE, verified suppliers");

    expect(parsed.categorySlugs).toEqual(["led-lighting"]);
    expect(parsed.budgetUsd).toBe(12);
    expect(parsed.certifications).toEqual(["ISO9001", "CE"]);
    expect(parsed.verifiedOnly).toBe(true);
  });

  it("keeps the subcategory and drops its parent when both match", () => {
    expect(parseQuery("ceramic tiles for a bathroom wall").categorySlugs).toEqual([
      "ceramic-wall-tiles",
    ]);
  });

  it("returns every subcategory an ambiguous word can mean", () => {
    expect(parseQuery("pipes").categorySlugs).toEqual(["steel-pipes", "pipes-fittings"]);
  });

  it("ignores case and accents", () => {
    const parsed = parseQuery("PORCELANATO de Turquía");

    expect(parsed.categorySlugs).toEqual(["porcelain-tiles"]);
    expect(parsed.countries).toEqual(["TR"]);
  });

  it("reads a decimal comma and a Spanish unit", () => {
    const parsed = parseQuery("2,5 toneladas de hierro");

    expect(parsed.categorySlugs).toEqual(["rebar"]);
    expect(parsed.quantity).toBe(2.5);
    expect(parsed.unit).toBe("ton");
  });

  it("falls back to free-text search terms with low confidence for unknown materials", () => {
    const parsed = parseQuery("bamboo flooring");

    expect(parsed.categorySlugs).toEqual([]);
    expect(parsed.searchTerms).toBe("bamboo or flooring");
    expect(parsed.confidence).toBe("low");
  });

  it("returns no confidence for greetings, empty text or requests without a material", () => {
    for (const text of ["", "   ", "hola, ¿cómo estás?", "500 from China"]) {
      const parsed = parseQuery(text);
      expect(parsed.confidence).toBe("none");
      expect(parsed.searchTerms).toBeNull();
    }
  });

  it("uses a balanced priority when the request asks for both price and speed", () => {
    expect(parseQuery("cheap and fast rebar").priority).toBe("balanced");
    expect(parseQuery("rebar").priority).toBe("balanced");
  });

  it("only reads the first characters of very long input", () => {
    const parsed = parseQuery(`${"a ".repeat(MAX_QUERY_LENGTH)} cement`);

    expect(parsed.categorySlugs).toEqual([]);
  });
});
