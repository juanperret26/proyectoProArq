import { describe, expect, it, vi } from "vitest";

import type { ProductSummary } from "@/lib/catalog/schemas";

import type { ExtractedCriteria } from "./extract";
import { parseQuery } from "./parse";
import {
  CANDIDATE_LIMIT,
  recommend,
  toCandidateArgs,
  toCatalogHref,
  toRankCriteria,
  toRecommendation,
  type AiFallback,
} from "./recommend";

const MEMBRANE: ProductSummary = {
  id: "p1",
  name_en: "Bitumen membrane 4 mm",
  name_es: null,
  unit: "roll",
  min_order_qty: 100,
  lead_time_days: 20,
  price_from_usd: 30,
  image_urls: [],
  category_slug: "waterproofing-membranes",
  parent_category_slug: "insulation-roofing",
  supplier_id: "s1",
  supplier_slug: "s1",
  supplier_name: "Supplier",
  country_code: "TR",
  is_verified: true,
};

const MODEL_CRITERIA: ExtractedCriteria = {
  onTopic: true,
  categorySlugs: ["waterproofing-membranes"],
  searchTerms: null,
  quantity: null,
  unit: null,
  budgetUsd: null,
  countries: [],
  certifications: [],
  verifiedOnly: false,
  priority: "balanced",
};

describe("recommend with an AI fallback", () => {
  it("does not call the model when the rules already found a material", async () => {
    const aiFallback = vi.fn<AiFallback>();
    const search = vi.fn(async () => ({ items: [MEMBRANE], total: 1 }));

    const result = await recommend("bitumen membrane", { search, aiFallback });

    expect(aiFallback).not.toHaveBeenCalled();
    expect(result.status).toBe("ok");
  });

  it("does not call the model for greetings or empty requests", async () => {
    const aiFallback = vi.fn<AiFallback>();
    const search = vi.fn();

    const result = await recommend("hola, ¿cómo estás?", { search, aiFallback });

    expect(result.status).toBe("offTopic");
    expect(search).not.toHaveBeenCalled();
    expect(aiFallback).not.toHaveBeenCalled();
  });

  it("asks the model when free text finds nothing and searches again with its criteria", async () => {
    const search = vi
      .fn()
      .mockResolvedValueOnce({ items: [], total: 0 })
      .mockResolvedValueOnce({ items: [MEMBRANE], total: 1 });
    const aiFallback = vi.fn<AiFallback>(async () => ({ status: "ok", criteria: MODEL_CRITERIA }));

    const result = await recommend("keep rainwater out of a flat terrace", { search, aiFallback });

    expect(aiFallback).toHaveBeenCalledOnce();
    expect(search.mock.calls[1][0].category_slugs).toEqual(["waterproofing-membranes"]);
    expect(result).toMatchObject({ status: "ok", aiAssisted: true });
  });

  it("reports the daily limit instead of calling the model again", async () => {
    const search = vi.fn(async () => ({ items: [], total: 0 }));
    const aiFallback = vi.fn<AiFallback>(async () => ({ status: "limit" }));

    const result = await recommend("keep rainwater out of a flat terrace", { search, aiFallback });

    expect(result).toMatchObject({ status: "offTopic", ai: "limit" });
  });

  it("treats a request the model marks as off-topic as off-topic", async () => {
    const search = vi.fn(async () => ({ items: [], total: 0 }));
    const aiFallback = vi.fn<AiFallback>(async () => ({
      status: "ok",
      criteria: { ...MODEL_CRITERIA, onTopic: false },
    }));

    const result = await recommend("escribime un poema", { search, aiFallback });

    expect(result.status).toBe("offTopic");
    expect(search).toHaveBeenCalledOnce();
  });
});

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
