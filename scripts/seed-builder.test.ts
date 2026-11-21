import { describe, expect, it } from "vitest";

import { CATEGORY_TAXONOMY } from "../src/lib/catalog/taxonomy";
import { buildSeedData, renderSeedSql } from "./seed-builder";

describe("buildSeedData", () => {
  const data = buildSeedData();

  it("generates 60 suppliers with unique slugs", () => {
    const slugs = new Set(data.suppliers.map((s) => s.slug));
    expect(data.suppliers).toHaveLength(60);
    expect(slugs.size).toBe(60);
  });

  it("generates about 400 products with unique external ids", () => {
    const ids = new Set(data.products.map((p) => p.externalId));
    expect(data.products.length).toBeGreaterThanOrEqual(400);
    expect(ids.size).toBe(data.products.length);
  });

  it("covers every subcategory of the original eight demo categories", () => {
    // Los rubros siguientes (maquinaria, camiones, prefabricados, metales) se
    // llenan con datos reales de Made-in-China, no con el catálogo de ejemplo.
    const DEMO_TOP_LEVEL_COUNT = 8;
    // Subrubros agregados después para los proveedores de Taiwán y Turquía.
    const ADDED_LATER = new Set([
      "drywall-plaster",
      "flooring",
      "heating-ventilation",
      "roof-windows",
      "sandwich-panels",
      "acoustic-insulation",
    ]);
    const covered = new Set(data.products.map((p) => p.categorySlug));
    const expected = CATEGORY_TAXONOMY.slice(0, DEMO_TOP_LEVEL_COUNT).flatMap((c) =>
      c.children.map((s) => s.slug).filter((slug) => !ADDED_LATER.has(slug)),
    );
    expect(expected.filter((slug) => !covered.has(slug))).toEqual([]);
  });

  it("references only suppliers that exist", () => {
    const slugs = new Set(data.suppliers.map((s) => s.slug));
    expect(data.products.every((p) => slugs.has(p.supplierSlug))).toBe(true);
  });

  it("orders price tiers by quantity with falling prices", () => {
    for (const product of data.products) {
      const qty = product.tiers.map((t) => t.minQty);
      const prices = product.tiers.map((t) => t.unitPrice);
      expect(qty).toEqual([...qty].sort((a, b) => a - b));
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
      expect(product.priceFrom).toBe(Math.min(...prices));
    }
  });

  it("gives the BIS certification only to Indian suppliers", () => {
    const offenders = data.suppliers.filter(
      (s) => s.certifications.includes("BIS") && s.countryCode !== "IN",
    );
    expect(offenders).toEqual([]);
  });

  it("is deterministic", () => {
    expect(renderSeedSql(buildSeedData())).toBe(renderSeedSql(data));
  });
});

describe("renderSeedSql", () => {
  it("escapes single quotes in text values", () => {
    const sql = renderSeedSql({
      suppliers: [
        {
          slug: "o-brien",
          name: "O'Brien Ltd",
          countryCode: "CN",
          city: "Foshan",
          foundedYear: 2000,
          businessType: "manufacturer",
          isVerified: true,
          responseHours: 4,
          descriptionEn: "d",
          descriptionEs: "d",
          certifications: [],
        },
      ],
      products: [],
    });
    expect(sql).toContain("'O''Brien Ltd'");
  });
});
