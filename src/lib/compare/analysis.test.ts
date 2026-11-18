import { describe, expect, it } from "vitest";

import type { ProductDetail } from "@/lib/catalog/schemas";

import {
  buildAnalysisPrompt,
  MAX_POINTS,
  parseAnalysis,
  toAnalysisInput,
  type ProductFacts,
} from "./analysis";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

function detail(id: string, overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id,
    name_en: `Tile ${id.slice(0, 1)}`,
    name_es: `Porcelanato ${id.slice(0, 1)}`,
    description_en: "Long description that should not be sent",
    description_es: null,
    specs: [],
    unit: "m2",
    min_order_qty: 500,
    lead_time_days: 25,
    price_from_usd: 8,
    category: { slug: "porcelain-tiles", name_en: "Porcelain tiles", name_es: "Porcelanatos" },
    supplier: {
      id: `s-${id}`,
      slug: `s-${id}`,
      name: "Supplier",
      country_code: "VN",
      city: "Hanoi",
      founded_year: 2008,
      business_type: "manufacturer",
      is_verified: true,
      response_time_hours: 6,
      description_en: "",
      description_es: null,
      certs: [{ certification: { code: "ISO9001", name: "ISO 9001" } }],
    },
    price_tiers: [
      { min_qty: 2000, unit_price_usd: 7 },
      { min_qty: 500, unit_price_usd: 8 },
    ],
    ...overrides,
  } as ProductDetail;
}

describe("toAnalysisInput", () => {
  it("keeps only the facts the model needs, in the active language", () => {
    const [facts] = toAnalysisInput([detail(A)], "es");

    expect(facts).toEqual({
      id: A,
      name: "Porcelanato 1",
      supplier: "Supplier",
      country: "VN",
      verifiedSupplier: true,
      businessType: "manufacturer",
      foundedYear: 2008,
      responseTimeHours: 6,
      certifications: ["ISO9001"],
      unit: "m2",
      minOrder: 500,
      leadTimeDays: 25,
      priceTiers: [
        { fromQty: 500, unitPriceUsd: 8 },
        { fromQty: 2000, unitPriceUsd: 7 },
      ],
    } satisfies ProductFacts);
    expect(JSON.stringify(facts)).not.toContain("Long description");
  });
});

describe("buildAnalysisPrompt", () => {
  it("passes products as JSON data and asks for the active language", () => {
    const facts = toAnalysisInput([detail(A), detail(B)], "es");

    const prompt = buildAnalysisPrompt(facts, "es");

    expect(prompt.system).toContain("Spanish");
    expect(prompt.system).toContain("Never write product ids in text");
    expect(JSON.parse(prompt.user)).toEqual({ products: facts });
  });
});

describe("parseAnalysis", () => {
  const valid = {
    summary: "Both are good.",
    bestOverall: A,
    options: [
      { productId: A, verdict: "bestPrice", pros: ["Cheapest"], cons: ["Slower"] },
      { productId: B, verdict: "fastest", pros: ["Ships in 10 days"], cons: [] },
    ],
    advice: "Pick A for large orders.",
  };

  it("accepts a valid analysis", () => {
    expect(parseAnalysis(valid, [A, B])).toEqual(valid);
  });

  it("drops products that were not compared and repeated entries", () => {
    const parsed = parseAnalysis(
      {
        ...valid,
        bestOverall: "33333333-3333-4333-8333-333333333333",
        options: [
          ...valid.options,
          { productId: A, verdict: "balanced", pros: ["dup"], cons: [] },
          { productId: "made-up", verdict: "balanced", pros: ["x"], cons: [] },
        ],
      },
      [A, B],
    );

    expect(parsed?.options.map((option) => option.productId)).toEqual([A, B]);
    expect(parsed?.bestOverall).toBeNull();
  });

  it("caps the number and length of pros and cons", () => {
    const parsed = parseAnalysis(
      {
        ...valid,
        options: [
          {
            productId: A,
            verdict: "bestPrice",
            pros: Array.from({ length: 9 }, () => "p".repeat(500)),
            cons: [],
          },
        ],
      },
      [A, B],
    );

    expect(parsed?.options[0].pros).toHaveLength(MAX_POINTS);
    expect(parsed?.options[0].pros[0].length).toBeLessThanOrEqual(160);
  });

  it("returns null for answers with the wrong shape or no usable products", () => {
    expect(parseAnalysis(null, [A, B])).toBeNull();
    expect(parseAnalysis({ ...valid, options: "none" }, [A, B])).toBeNull();
    expect(parseAnalysis({ ...valid, options: [] }, [A, B])).toBeNull();
    expect(
      parseAnalysis({ ...valid, options: [{ ...valid.options[0], verdict: "magic" }] }, [A, B]),
    ).toBeNull();
  });
});
