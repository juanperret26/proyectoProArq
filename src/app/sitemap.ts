import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";

import { routing } from "@/i18n/routing";
import { allCategorySlugs } from "@/lib/catalog/category-lookup";
import { createPublicClient } from "@/lib/supabase/public-client";
import { alternatesFor, localizedUrl, siteUrl } from "@/lib/seo/site";

const STATIC_PATHS = ["/", "/search", "/compare", "/assistant"];
/** Filas por consulta: Supabase devuelve como máximo 1000 por vez. */
const PAGE = 1000;

/** Lee toda la columna página por página; así el sitemap no se corta al crecer el catálogo. */
async function listColumn(table: "products" | "suppliers", column: "id" | "slug"): Promise<string[]> {
  const client = createPublicClient();
  const values: string[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from(table)
      .select(column)
      .order(column)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`No se pudo listar ${table}: ${error.message}`);
    const rows = data as unknown as Record<string, string>[];
    values.push(...rows.map((row) => row[column]));
    if (rows.length < PAGE) return values;
  }
}

/** Cada página existe en todos los idiomas y se enlaza con sus traducciones. */
function entriesFor(base: string, path: string): MetadataRoute.Sitemap {
  const { languages } = alternatesFor(base, routing.defaultLocale, path);
  return routing.locales.map((locale) => ({
    url: localizedUrl(base, locale, path),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("hours");
  const base = siteUrl();
  const [productIds, supplierSlugs] = await Promise.all([
    listColumn("products", "id"),
    listColumn("suppliers", "slug"),
  ]);
  const paths = [
    ...STATIC_PATHS,
    ...allCategorySlugs().map((slug) => `/categories/${slug}`),
    ...supplierSlugs.map((slug) => `/suppliers/${slug}`),
    ...productIds.map((id) => `/products/${id}`),
  ];
  return paths.flatMap((path) => entriesFor(base, path));
}
