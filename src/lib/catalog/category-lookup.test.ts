import { describe, expect, it } from "vitest";

import { allCategorySlugs, lookupCategory } from "./category-lookup";

describe("lookupCategory", () => {
  it("finds a top-level category with no parent", () => {
    const match = lookupCategory("steel-structures");
    expect(match?.entry.slug).toBe("steel-structures");
    expect(match?.parent).toBeNull();
    expect(match?.top.glyph).toBe("steel");
  });

  it("finds a subcategory with its parent", () => {
    const match = lookupCategory("rebar");
    expect(match?.entry.nameEn).toBe("Reinforcing bar");
    expect(match?.parent?.slug).toBe("steel-structures");
    expect(match?.top.slug).toBe("steel-structures");
  });

  it("returns undefined for unknown slugs", () => {
    expect(lookupCategory("does-not-exist")).toBeUndefined();
  });
});

describe("allCategorySlugs", () => {
  it("lists top-level and child slugs without duplicates", () => {
    const slugs = allCategorySlugs();
    expect(slugs).toContain("cement-concrete");
    expect(slugs).toContain("portland-cement");
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toHaveLength(40);
  });
});
