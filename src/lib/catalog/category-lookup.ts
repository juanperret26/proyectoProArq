import {
  CATEGORY_TAXONOMY,
  type TaxonomyCategory,
  type TaxonomyEntry,
} from "./taxonomy";

export interface CategoryMatch {
  /** El rubro buscado: de primer nivel o subrubro. */
  entry: TaxonomyEntry;
  /** Rubro padre; null si `entry` ya es de primer nivel. */
  parent: TaxonomyCategory | null;
  /** Rubro de primer nivel al que pertenece (define el símbolo de plano). */
  top: TaxonomyCategory;
}

export function lookupCategory(slug: string): CategoryMatch | undefined {
  for (const top of CATEGORY_TAXONOMY) {
    if (top.slug === slug) return { entry: top, parent: null, top };
    const child = top.children.find((c) => c.slug === slug);
    if (child) return { entry: child, parent: top, top };
  }
  return undefined;
}

export function allCategorySlugs(): string[] {
  return CATEGORY_TAXONOMY.flatMap((top) => [
    top.slug,
    ...top.children.map((child) => child.slug),
  ]);
}
