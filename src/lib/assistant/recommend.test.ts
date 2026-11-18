import { describe, expect, it } from "vitest";

import { parseQuery } from "./parse";
import {
  CANDIDATE_LIMIT,
  toCandidateArgs,
  toCatalogHref,
  toRankCriteria,
  toRecommendation,
} from "./recommend";

describe("toRecommendation", () => {
  it("treats free text that matches nothing in the catalog as off-topic", () => {
    const parsed = parseQuery("escribime un poema");

    expect(toRecommendation(parsed, { items: [], total: 0 }).status).toBe("offTopic");
  });

  it("keeps an empty result for a known material so the buyer can loosen filters", () => {
    const parsed = parseQuery("rebar under $1");

    const result = toRecommendation(parsed, { items: [], total: 0 });

    expect(result.status).toBe("ok");
  });
});

describe("toCandidateArgs", () => {
  it("searches by category and filters without a text query when a material was found", () => {
    const args = toCandidateArgs(
      parseQuery("porcelain tile under $20 from Vietnam, ISO 9001, verified"),
    );

    expect(args).toEqual({
      search_query: null,
      category_slugs: ["porcelain-tiles"],
      country_codes: ["VN"],
      price_min: null,
      price_max: 20,
      max_min_order: null,
      max_lead_time_days: null,
      certification_codes: ["ISO9001"],
      verified_only: true,
      sort_by: "relevance",
      page_size: CANDIDATE_LIMIT,
      page_offset: 0,
    });
  });

  it("uses the free-text terms when no material was found", () => {
    const args = toCandidateArgs(parseQuery("bamboo flooring"));

    expect(args.search_query).toBe("bamboo or flooring");
    expect(args.category_slugs).toBeNull();
    expect(args.country_codes).toBeNull();
    expect(args.certification_codes).toBeNull();
  });
});

describe("toRankCriteria", () => {
  it("passes priority, quantity, unit and budget to the ranking", () => {
    expect(toRankCriteria(parseQuery("200 bags of cement under $9, urgent"))).toEqual({
      priority: "lead_time",
      quantity: 200,
      unit: "bag",
      budgetUsd: 9,
    });
  });
});

describe("toCatalogHref", () => {
  it("opens the first category with the detected filters and sort", () => {
    expect(toCatalogHref(parseQuery("cheapest rebar from India, verified"))).toBe(
      "/categories/rebar?country=IN&verified=1&sort=price_asc",
    );
  });

  it("sorts by lead time when speed is the priority", () => {
    expect(toCatalogHref(parseQuery("urgent toilets"))).toBe(
      "/categories/toilets?sort=lead_time",
    );
  });

  it("opens the search page with the free-text terms when no material was found", () => {
    expect(toCatalogHref(parseQuery("bamboo flooring under $30"))).toBe(
      "/search?q=bamboo+or+flooring&maxPrice=30",
    );
  });
});
