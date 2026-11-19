import { describe, expect, it } from "vitest";

import type { SupplierCache } from "./made-in-china-cache";
import { DEFAULT_LEAD_TIME_DAYS, type MicSupplier } from "./made-in-china-parser";
import type { ScrapedProductPage } from "./made-in-china-product-page";
import { buildProducts } from "./made-in-china-products";

const SUPPLIER: MicSupplier = {
  slug: "acme-formwork",
  name: "Acme Formwork Co., Ltd.",
  countryCode: "CN",
  city: "Shangqiu",
  foundedYear: 2014,
  businessType: "manufacturer",
  certifications: [],
  descriptionEn: "d",
  descriptionEs: "d",
  sourceUrl: "https://acme.en.made-in-china.com/",
  externalId: "acme",
  scrapedAt: "2026-11-19T20:00:00Z",
};

function page(overrides: Partial<ScrapedProductPage> = {}): ScrapedProductPage {
  return {
    externalId: "AAAAAAAAAAAA",
    name: "Aluminum Formwork Panel",
    description: "Reusable panels.",
    categoryPath: ["Construction & Decoration"],
    imageUrls: ["https://image.made-in-china.com/203f0j00AAA/Panel.webp"],
    specs: [{ label: "Material", value: "Aluminum" }],
    price: { tiers: [{ minQty: 50, unitPrice: 118 }, { minQty: 100, unitPrice: 113 }], minOrderQty: 50, unit: "piece", lowestPrice: 113 },
    priceIssue: null,
    leadTimeDays: 30,
    sourceUrl: "https://acme.en.made-in-china.com/product/AAAAAAAAAAAA/China-Panel.html",
    ...overrides,
  };
}

function cache(pages: (ScrapedProductPage | { error: string })[]): SupplierCache {
  return {
    supplierId: "acme",
    fetchedAt: "2026-11-19T21:00:00.000Z",
    profileText: null,
    products: pages.map((entry, index) =>
      "error" in entry
        ? { url: `https://acme.en.made-in-china.com/product/E${index}/x.html`, page: null, error: entry.error }
        : { url: entry.sourceUrl, page: entry, error: null },
    ),
  };
}

function build(pages: (ScrapedProductPage | { error: string })[], nameEs: Record<string, string> = {}) {
  return buildProducts([{ supplier: SUPPLIER, cache: cache(pages) }], nameEs);
}

describe("buildProducts", () => {
  it("convierte una ficha con precio y rubro en un producto cargable", () => {
    const { products, omitted } = build([page()]);

    expect(omitted).toEqual([]);
    expect(products[0]).toMatchObject({
      externalId: "AAAAAAAAAAAA",
      supplierExternalId: "acme",
      categorySlug: "scaffolding",
      nameEn: "Aluminum Formwork Panel",
      nameEs: null,
      descriptionEn: "Reusable panels.",
      descriptionEs: null,
      unit: "piece",
      minOrder: 50,
      leadTimeDays: 30,
      priceFrom: 113,
      tiers: [{ minQty: 50, unitPrice: 118 }, { minQty: 100, unitPrice: 113 }],
      imageUrls: ["https://image.made-in-china.com/203f0j00AAA/Panel.webp"],
      scrapedAt: "2026-11-19T21:00:00.000Z",
    });
    expect(products[0].specs).toEqual([{ label_en: "Material", label_es: "Material", value: "Aluminum" }]);
  });

  it("usa la traducción del nombre cuando existe", () => {
    const { products } = build([page()], { AAAAAAAAAAAA: "Panel de encofrado de aluminio" });

    expect(products[0].nameEs).toBe("Panel de encofrado de aluminio");
  });

  it("usa el plazo por defecto y arma una descripción cuando la ficha no los trae", () => {
    const { products } = build([page({ leadTimeDays: null, description: "" })]);

    expect(products[0].leadTimeDays).toBe(DEFAULT_LEAD_TIME_DAYS);
    expect(products[0].descriptionEn).toContain("Aluminum Formwork Panel from Acme Formwork Co., Ltd. (Shangqiu)");
  });

  it("recorta las descripciones muy largas", () => {
    const { products } = build([page({ description: "x".repeat(5000) })]);

    expect(products[0].descriptionEn.length).toBeLessThanOrEqual(1500);
  });

  it("omite y explica: sin ficha, sin precio, fuera de rubro y repetidos", () => {
    const { products, omitted } = build([
      { error: "HTTP 404" },
      page({ externalId: "BBBBBBBBBBBB", price: null, priceIssue: "sin precio numérico en la ficha" }),
      page({ externalId: "CCCCCCCCCCCC", name: "Tower Crane QTZ80" }),
      page({ externalId: "DDDDDDDDDDDD" }),
      page({ externalId: "DDDDDDDDDDDD" }),
    ]);

    expect(products).toHaveLength(1);
    expect(omitted.map((entry) => entry.reason)).toEqual(["sin ficha", "sin precio", "fuera de rubro", "repetido"]);
    expect(omitted[1].detail).toBe("sin precio numérico en la ficha");
  });

  it("no rompe con un proveedor sin caché", () => {
    expect(buildProducts([{ supplier: SUPPLIER, cache: null }], {})).toEqual({ products: [], omitted: [] });
  });
});
