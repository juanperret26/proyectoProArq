import { describe, expect, it } from "vitest";

import { marketplaceStoreUrl, wikidataProfileUrl } from "./source";

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

describe("marketplaceStoreUrl", () => {
  const url = "https://acme.en.made-in-china.com/";
  it("devuelve la tienda de un proveedor de Made-in-China", () => {
    expect(marketplaceStoreUrl("made-in-china", url)).toBe(url);
  });
  it("devuelve null con otro origen o sin dirección", () => {
    expect(marketplaceStoreUrl("seed", url)).toBeNull();
    expect(marketplaceStoreUrl("made-in-china", null)).toBeNull();
  });
  it("rechaza http, otros hosts y esquemas peligrosos", () => {
    expect(marketplaceStoreUrl("made-in-china", "http://a.en.made-in-china.com/")).toBeNull();
    expect(marketplaceStoreUrl("made-in-china", "https://a.en.made-in-china.com.evil.example/")).toBeNull();
    expect(marketplaceStoreUrl("made-in-china", "javascript:alert(1)")).toBeNull();
  });
});

describe("marketplaceStoreUrl con IndiaMART", () => {
  const url = "https://www.indiamart.com/acme-scaffolds/";
  it("acepta la tienda de IndiaMART", () => {
    expect(marketplaceStoreUrl("indiamart", url)).toBe(url);
  });
  it("rechaza otros hosts, http y orígenes cruzados", () => {
    expect(marketplaceStoreUrl("indiamart", "https://evil.example/acme/")).toBeNull();
    expect(marketplaceStoreUrl("indiamart", "http://www.indiamart.com/acme/")).toBeNull();
    expect(marketplaceStoreUrl("made-in-china", url)).toBeNull();
  });
});

describe("marketplaceStoreUrl con sitios oficiales de directorios", () => {
  it("acepta el sitio https de una empresa de Kompass o Dalil", () => {
    expect(marketplaceStoreUrl("dalil", "https://www.fixa.com.tr/")).toBe("https://www.fixa.com.tr/");
    expect(marketplaceStoreUrl("kompass", "https://www.shehfung.com/")).toBe("https://www.shehfung.com/");
  });
  it("rechaza http, esquemas peligrosos y valores vacíos", () => {
    expect(marketplaceStoreUrl("dalil", "http://www.fixa.com.tr/")).toBeNull();
    expect(marketplaceStoreUrl("dalil", "javascript:alert(1)")).toBeNull();
    expect(marketplaceStoreUrl("kompass", "https://evil.example/ x")).toBeNull();
    expect(marketplaceStoreUrl("dalil", null)).toBeNull();
  });
});
