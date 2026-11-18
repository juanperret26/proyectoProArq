import { describe, expect, it } from "vitest";

import type { ProductSummary } from "@/lib/catalog/schemas";

import { rankProducts } from "./rank";

function product(overrides: Partial<ProductSummary> & { id: string }): ProductSummary {
  return {
    name_en: `Product ${overrides.id}`,
    name_es: null,
    unit: "m2",
    min_order_qty: 100,
    lead_time_days: 30,
    price_from_usd: 10,
    image_urls: [],
    category_slug: "tiles",
    parent_category_slug: null,
    supplier_id: `s-${overrides.id}`,
    supplier_slug: `supplier-${overrides.id}`,
    supplier_name: `Supplier ${overrides.id}`,
    country_code: "VN",
    is_verified: false,
    ...overrides,
  };
}

const BASE = { quantity: null, unit: null, budgetUsd: null } as const;

describe("rankProducts", () => {
  it("returns an empty list when there are no candidates", () => {
    expect(rankProducts([], { ...BASE, priority: "balanced" })).toEqual([]);
  });

  it("puts the cheapest product first when price is the priority", () => {
    const candidates = [
      product({ id: "a", price_from_usd: 12, lead_time_days: 10 }),
      product({ id: "b", price_from_usd: 8, lead_time_days: 40 }),
    ];

    const ranked = rankProducts(candidates, { ...BASE, priority: "price" });

    expect(ranked.map((r) => r.product.id)).toEqual(["b", "a"]);
    expect(ranked[0].reasons).toContain("cheapest");
  });

  it("puts the fastest product first when lead time is the priority", () => {
    const candidates = [
      product({ id: "a", price_from_usd: 12, lead_time_days: 10 }),
      product({ id: "b", price_from_usd: 8, lead_time_days: 40 }),
    ];

    const ranked = rankProducts(candidates, { ...BASE, priority: "lead_time" });

    expect(ranked.map((r) => r.product.id)).toEqual(["a", "b"]);
    expect(ranked[0].reasons).toContain("fastest");
  });

  it("prefers a verified supplier when price and lead time are equal", () => {
    const candidates = [
      product({ id: "a", is_verified: false }),
      product({ id: "b", is_verified: true }),
    ];

    const ranked = rankProducts(candidates, { ...BASE, priority: "balanced" });

    expect(ranked[0].product.id).toBe("b");
    expect(ranked[0].reasons).toContain("verified");
  });

  it("demotes products whose minimum order is above the requested quantity", () => {
    const candidates = [
      product({ id: "a", price_from_usd: 5, min_order_qty: 1000 }),
      product({ id: "b", price_from_usd: 9, min_order_qty: 200 }),
    ];

    const ranked = rankProducts(candidates, { ...BASE, quantity: 500, priority: "price" });

    expect(ranked.map((r) => r.product.id)).toEqual(["b", "a"]);
    expect(ranked[0].reasons).toContain("meetsMinOrder");
    expect(ranked[1].reasons).toContain("minOrderAboveQuantity");
  });

  it("ignores the minimum order when the requested unit differs from the product unit", () => {
    const candidates = [product({ id: "a", unit: "bag", min_order_qty: 1000 })];

    const ranked = rankProducts(candidates, {
      ...BASE,
      quantity: 5,
      unit: "ton",
      priority: "balanced",
    });

    expect(ranked[0].reasons).not.toContain("minOrderAboveQuantity");
    expect(ranked[0].reasons).not.toContain("meetsMinOrder");
  });

  it("compares the minimum order when the requested unit matches", () => {
    const candidates = [product({ id: "a", unit: "bag", min_order_qty: 1000 })];

    const ranked = rankProducts(candidates, {
      ...BASE,
      quantity: 5,
      unit: "bag",
      priority: "balanced",
    });

    expect(ranked[0].reasons).toContain("minOrderAboveQuantity");
  });

  it("marks products within the budget per unit", () => {
    const candidates = [
      product({ id: "a", price_from_usd: 7 }),
      product({ id: "b", price_from_usd: 15 }),
    ];

    const ranked = rankProducts(candidates, { ...BASE, budgetUsd: 10, priority: "balanced" });

    const byId = Object.fromEntries(ranked.map((r) => [r.product.id, r.reasons]));
    expect(byId.a).toContain("withinBudget");
    expect(byId.b).not.toContain("withinBudget");
  });

  it("does not call a product cheapest or fastest when all candidates tie", () => {
    const ranked = rankProducts([product({ id: "a" }), product({ id: "b" })], {
      ...BASE,
      priority: "balanced",
    });

    for (const item of ranked) {
      expect(item.reasons).not.toContain("cheapest");
      expect(item.reasons).not.toContain("fastest");
    }
  });

  it("keeps at most the requested number of results with a stable order", () => {
    const candidates = ["c", "a", "b"].map((id) => product({ id }));

    const ranked = rankProducts(candidates, { ...BASE, priority: "balanced" }, 2);

    expect(ranked.map((r) => r.product.id)).toEqual(["a", "b"]);
  });

  it("scores between 0 and 1 and does not mutate the input", () => {
    const candidates = [
      product({ id: "a", price_from_usd: 3, lead_time_days: 5, is_verified: true }),
      product({ id: "b", price_from_usd: 30, lead_time_days: 60 }),
    ];
    const snapshot = structuredClone(candidates);

    const ranked = rankProducts(candidates, { ...BASE, priority: "balanced" });

    expect(candidates).toEqual(snapshot);
    for (const item of ranked) {
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(1);
    }
  });
});
