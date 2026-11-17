import { describe, expect, it } from "vitest";

import {
  PAGE_SIZE,
  parseSearchFilters,
  toQueryString,
  toSearchRpcArgs,
} from "./filters";

describe("parseSearchFilters", () => {
  it("returns defaults for empty params", () => {
    expect(parseSearchFilters({})).toEqual({
      q: null,
      category: null,
      countries: [],
      priceMin: null,
      priceMax: null,
      maxMinOrder: null,
      maxLeadTime: null,
      certifications: [],
      verifiedOnly: false,
      sort: "relevance",
      page: 1,
    });
  });

  it("trims the query and treats blank text as no query", () => {
    expect(parseSearchFilters({ q: "  tile  " }).q).toBe("tile");
    expect(parseSearchFilters({ q: "   " }).q).toBeNull();
  });

  it("caps very long queries", () => {
    expect(parseSearchFilters({ q: "a".repeat(500) }).q).toHaveLength(120);
  });

  it("accepts repeated country and certification params", () => {
    const filters = parseSearchFilters({
      country: ["IN", "TW"],
      cert: ["CE", "ISO9001"],
    });
    expect(filters.countries).toEqual(["IN", "TW"]);
    expect(filters.certifications).toEqual(["CE", "ISO9001"]);
  });

  it("drops malformed country and certification codes", () => {
    const filters = parseSearchFilters({
      country: ["in", "XYZ", "CN"],
      cert: ["CE'; drop", "BIS"],
    });
    expect(filters.countries).toEqual(["CN"]);
    expect(filters.certifications).toEqual(["BIS"]);
  });

  it("ignores invalid numbers and negatives", () => {
    const filters = parseSearchFilters({
      minPrice: "abc",
      maxPrice: "-5",
      moq: "100",
      lead: "30",
    });
    expect(filters.priceMin).toBeNull();
    expect(filters.priceMax).toBeNull();
    expect(filters.maxMinOrder).toBe(100);
    expect(filters.maxLeadTime).toBe(30);
  });

  it("requires a whole number for the lead time", () => {
    expect(parseSearchFilters({ lead: "1.5" }).maxLeadTime).toBeNull();
    expect(parseSearchFilters({ lead: "45" }).maxLeadTime).toBe(45);
  });

  it("rejects numbers too large for the database", () => {
    const filters = parseSearchFilters({
      lead: "99999999999",
      minPrice: "1e12",
      moq: "99999999999",
    });
    expect(filters.maxLeadTime).toBeNull();
    expect(filters.priceMin).toBeNull();
    expect(filters.maxMinOrder).toBeNull();
  });

  it("falls back to relevance for unknown sort values", () => {
    expect(parseSearchFilters({ sort: "drop table" }).sort).toBe("relevance");
    expect(parseSearchFilters({ sort: "price_asc" }).sort).toBe("price_asc");
  });

  it("clamps the page to a positive integer", () => {
    expect(parseSearchFilters({ page: "0" }).page).toBe(1);
    expect(parseSearchFilters({ page: "-3" }).page).toBe(1);
    expect(parseSearchFilters({ page: "2.7" }).page).toBe(1);
    expect(parseSearchFilters({ page: "4" }).page).toBe(4);
  });

  it("rejects category slugs with unsafe characters", () => {
    expect(parseSearchFilters({ category: "rebar" }).category).toBe("rebar");
    expect(parseSearchFilters({ category: "Re bar!" }).category).toBeNull();
  });

  it("reads the verified flag only from 1", () => {
    expect(parseSearchFilters({ verified: "1" }).verifiedOnly).toBe(true);
    expect(parseSearchFilters({ verified: "true" }).verifiedOnly).toBe(false);
  });
});

describe("toSearchRpcArgs", () => {
  it("maps filters to search_products arguments with paging offset", () => {
    const filters = parseSearchFilters({
      q: "cement",
      country: "IN",
      page: "3",
      verified: "1",
    });
    expect(toSearchRpcArgs(filters)).toMatchObject({
      search_query: "cement",
      country_codes: ["IN"],
      category_slugs: null,
      certification_codes: null,
      verified_only: true,
      page_size: PAGE_SIZE,
      page_offset: PAGE_SIZE * 2,
    });
  });

  it("lets a route fix the category", () => {
    const filters = parseSearchFilters({});
    expect(toSearchRpcArgs(filters, "rebar").category_slugs).toEqual(["rebar"]);
  });
});

describe("toQueryString", () => {
  it("omits defaults and keeps repeated params", () => {
    const filters = parseSearchFilters({ q: "tile", country: ["IN", "CN"] });
    expect(toQueryString(filters)).toBe("q=tile&country=IN&country=CN");
  });

  it("applies overrides without mutating the original filters", () => {
    const filters = parseSearchFilters({ q: "tile" });
    expect(toQueryString(filters, { page: 2 })).toBe("q=tile&page=2");
    expect(filters.page).toBe(1);
  });

  it("round-trips through the parser", () => {
    const filters = parseSearchFilters({
      q: "porcelain tile",
      country: ["TW"],
      minPrice: "5",
      sort: "price_desc",
      verified: "1",
      page: "2",
    });
    const params = Object.fromEntries(
      new URLSearchParams(toQueryString(filters)).entries(),
    );
    expect(parseSearchFilters({ ...params, country: "TW" })).toEqual(filters);
  });
});
