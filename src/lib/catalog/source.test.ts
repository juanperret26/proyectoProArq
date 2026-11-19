import { describe, expect, it } from "vitest";

import { wikidataProfileUrl } from "./source";

describe("wikidataProfileUrl", () => {
  it("returns the item url for a profile compiled from Wikidata", () => {
    expect(
      wikidataProfileUrl("wikidata", "https://www.wikidata.org/wiki/Q545565"),
    ).toBe("https://www.wikidata.org/wiki/Q545565");
  });

  it("returns null for suppliers that come from another source", () => {
    expect(wikidataProfileUrl("seed", null)).toBeNull();
    expect(
      wikidataProfileUrl("seed", "https://www.wikidata.org/wiki/Q545565"),
    ).toBeNull();
  });

  it("returns null when a Wikidata supplier has no source url", () => {
    expect(wikidataProfileUrl("wikidata", null)).toBeNull();
  });

  it("rejects urls that are not a Wikidata item over https", () => {
    expect(wikidataProfileUrl("wikidata", "http://www.wikidata.org/wiki/Q1")).toBeNull();
    expect(wikidataProfileUrl("wikidata", "https://evil.example/wiki/Q1")).toBeNull();
    expect(
      wikidataProfileUrl("wikidata", "https://www.wikidata.org.evil.example/wiki/Q1"),
    ).toBeNull();
    expect(wikidataProfileUrl("wikidata", "javascript:alert(1)")).toBeNull();
    expect(wikidataProfileUrl("wikidata", "https://www.wikidata.org/wiki/Q12abc")).toBeNull();
  });
});
