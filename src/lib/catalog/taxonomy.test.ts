import { describe, expect, it } from "vitest";
import { CATEGORY_TAXONOMY, findTaxonomyCategory } from "./taxonomy";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("CATEGORY_TAXONOMY", () => {
  it("define ocho rubros de construcción de primer nivel", () => {
    expect(CATEGORY_TAXONOMY).toHaveLength(8);
  });

  it("usa slugs únicos y en kebab-case en rubros y subrubros", () => {
    const slugs = CATEGORY_TAXONOMY.flatMap((category) => [
      category.slug,
      ...category.children.map((child) => child.slug),
    ]);

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(SLUG_PATTERN);
    }
  });

  it("tiene nombre en inglés y en español para cada entrada", () => {
    const entries = CATEGORY_TAXONOMY.flatMap((category) => [
      category,
      ...category.children,
    ]);

    for (const entry of entries) {
      expect(entry.nameEn.trim()).not.toBe("");
      expect(entry.nameEs.trim()).not.toBe("");
    }
  });

  it("asigna un símbolo de plano distinto a cada rubro", () => {
    const glyphs = CATEGORY_TAXONOMY.map((category) => category.glyph);

    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  it("da al menos tres subrubros a cada rubro", () => {
    for (const category of CATEGORY_TAXONOMY) {
      expect(category.children.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("findTaxonomyCategory", () => {
  it("encuentra un rubro por su slug", () => {
    expect(findTaxonomyCategory("tiles-ceramics")?.nameEn).toBe(
      "Tiles & ceramics",
    );
  });

  it("devuelve undefined si el slug no existe", () => {
    expect(findTaxonomyCategory("furniture")).toBeUndefined();
  });
});
