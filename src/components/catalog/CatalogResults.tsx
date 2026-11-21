import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { toQueryString, type SearchFilters } from "@/lib/catalog/filters";
import { getFilterOptions, searchProducts } from "@/lib/catalog/queries";

import { FilterDisclosure } from "./FilterDisclosure";
import { FilterSidebar } from "./FilterSidebar";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";

type Props = {
  filters: SearchFilters;
  /** Ruta sin idioma de la página, p. ej. "/search" o "/categories/rebar". */
  basePath: string;
  /** Rubro fijado por la ruta; null si el rubro viene de los filtros. */
  category: string | null;
  /** Parámetros que el formulario de filtros debe conservar. */
  hidden: Readonly<Record<string, string>>;
};

export async function CatalogResults({ filters, basePath, category, hidden }: Props) {
  const [result, options, t] = await Promise.all([
    searchProducts(filters, category ?? filters.category),
    getFilterOptions(),
    getTranslations("catalog"),
  ]);
  if (result.items.length === 0 && filters.page > 1) {
    // Página fuera de rango: se vuelve a la primera con los mismos filtros.
    const locale = await getLocale();
    const query = toQueryString(filters, { page: 1 });
    redirect(`/${locale}${basePath}${query ? `?${query}` : ""}`);
  }
  // En un rubro fijado por la ruta, la URL no repite el rubro.
  const urlFilters = category ? { ...filters, category: null } : filters;
  const clearQuery = new URLSearchParams(hidden).toString();
  const clearHref = clearQuery ? `${basePath}?${clearQuery}` : basePath;

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
      <aside>
        <FilterDisclosure label={t("filtersTitle")}>
          <FilterSidebar
            filters={filters}
            options={options}
            basePath={basePath}
            hidden={hidden}
            clearHref={clearHref}
          />
        </FilterDisclosure>
      </aside>

      <section aria-labelledby="results-count">
        <p id="results-count" className="font-semibold tabular-nums">
          {t("resultCount", { count: result.total })}
        </p>

        {result.items.length === 0 ? (
          <div className="mt-6 border border-dashed border-rule-strong p-8">
            <h2 className="font-display text-[1.75rem] font-bold leading-tight">
              {t("noResultsTitle")}
            </h2>
            <p className="mt-2 max-w-[48ch] text-ink-soft">{t("noResultsBody")}</p>
            <Link href={clearHref} className="btn btn-outline mt-5">
              {t("clearFilters")}
            </Link>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((product) => (
              <li key={product.id} className="flex">
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}

        <Pagination filters={urlFilters} basePath={basePath} total={result.total} />
      </section>
    </div>
  );
}

/** Marcador mientras llegan los resultados. */
export function ResultsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid gap-4 sm:grid-cols-2 lg:ml-[19rem] xl:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-72 animate-pulse border border-rule bg-vellum" />
      ))}
    </div>
  );
}
