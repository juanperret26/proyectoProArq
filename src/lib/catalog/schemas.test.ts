import { describe, expect, it } from "vitest";

import { productSummarySchema, supplierDetailSchema, supplierSchema } from "./schemas";

const summary = {
  id: "p1",
  name_en: "Tile",
  name_es: null,
  unit: "m2",
  min_order_qty: 100,
  lead_time_days: 20,
  price_from_usd: 5.5,
  image_urls: [],
  category_slug: "porcelain-tiles",
  parent_category_slug: null,
  supplier_id: "s1",
  supplier_slug: "acme",
  supplier_name: "Acme",
  country_code: "CN",
  is_verified: true,
};

describe("productSummarySchema", () => {
  it("accepts a product with no Spanish name", () => {
    expect(productSummarySchema.parse(summary).name_es).toBeNull();
  });

  it("drops extra columns such as total_count", () => {
    const parsed = productSummarySchema.parse({ ...summary, total_count: 9 });
    expect("total_count" in parsed).toBe(false);
  });

  it("rejects a response with a missing field", () => {
    const incomplete = { ...summary, price_from_usd: undefined };
    expect(() => productSummarySchema.parse(incomplete)).toThrow();
  });
});

describe("supplierSchema", () => {
  it("rejects an unknown business type", () => {
    expect(() =>
      supplierSchema.parse({
        id: "s1",
        slug: "acme",
        name: "Acme",
        country_code: "CN",
        city: "Foshan",
        founded_year: null,
        business_type: "wholesaler",
        is_verified: false,
        response_time_hours: null,
        description_en: "d",
        description_es: null,
      }),
    ).toThrow();
  });
});

describe("supplierDetailSchema", () => {
  const detail = {
    id: "s1",
    slug: "acme",
    name: "Acme",
    country_code: "CN",
    city: "Foshan",
    founded_year: null,
    business_type: "manufacturer",
    is_verified: false,
    response_time_hours: null,
    description_en: "d",
    description_es: null,
    certs: [],
  };

  it("keeps where the supplier profile came from", () => {
    const parsed = supplierDetailSchema.parse({
      ...detail,
      source_site: "wikidata",
      source_url: "https://www.wikidata.org/wiki/Q1",
    });
    expect(parsed.source_site).toBe("wikidata");
    expect(parsed.source_url).toBe("https://www.wikidata.org/wiki/Q1");
  });

  it("accepts a supplier without a source url", () => {
    expect(
      supplierDetailSchema.parse({ ...detail, source_site: "seed", source_url: null })
        .source_url,
    ).toBeNull();
  });

  it("rejects a supplier row without its source", () => {
    expect(() => supplierDetailSchema.parse(detail)).toThrow();
  });
});
