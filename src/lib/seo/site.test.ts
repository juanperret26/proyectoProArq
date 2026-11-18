import { describe, expect, it } from "vitest";

import { alternatesFor, localizedUrl, siteUrl, truncateDescription } from "./site";

describe("siteUrl", () => {
  it("uses the configured address without a trailing slash", () => {
    expect(siteUrl("https://proarq.example/")).toBe("https://proarq.example");
  });

  it("falls back to localhost when nothing is configured or the value is not a URL", () => {
    expect(siteUrl(undefined)).toBe("http://localhost:3000");
    expect(siteUrl("not a url")).toBe("http://localhost:3000");
  });
});

describe("localizedUrl", () => {
  it("prefixes the locale and handles the home page", () => {
    expect(localizedUrl("https://x.test", "es", "/categories/rebar")).toBe(
      "https://x.test/es/categories/rebar",
    );
    expect(localizedUrl("https://x.test", "en", "/")).toBe("https://x.test/en");
  });
});

describe("alternatesFor", () => {
  it("points the canonical at the current language and lists every language", () => {
    expect(alternatesFor("https://x.test", "es", "/products/abc")).toEqual({
      canonical: "https://x.test/es/products/abc",
      languages: {
        en: "https://x.test/en/products/abc",
        es: "https://x.test/es/products/abc",
        "x-default": "https://x.test/en/products/abc",
      },
    });
  });
});

describe("truncateDescription", () => {
  it("collapses whitespace and cuts long text at a word with an ellipsis", () => {
    const text = `${"word ".repeat(60)}`;

    const result = truncateDescription(text, 50);

    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toContain("  ");
  });

  it("returns short text unchanged", () => {
    expect(truncateDescription("  Short   text ", 50)).toBe("Short text");
  });
});
