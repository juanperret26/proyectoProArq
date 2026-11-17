import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { PAGE_SIZE, toQueryString, type SearchFilters } from "@/lib/catalog/filters";

type Props = {
  filters: SearchFilters;
  basePath: string;
  total: number;
};

export async function Pagination({ filters, basePath, total }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (totalPages === 1) return null;

  const t = await getTranslations("catalog.pagination");
  const hrefFor = (page: number): string => {
    const query = toQueryString(filters, { page });
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav
      aria-label={t("label")}
      className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-ink pt-5"
    >
      <p className="tabular-nums text-ink-soft">
        {t("page", { page: filters.page, total: totalPages })}
      </p>
      <div className="flex gap-3">
        {filters.page > 1 ? (
          <Link href={hrefFor(filters.page - 1)} className="btn btn-outline">
            {t("previous")}
          </Link>
        ) : null}
        {filters.page < totalPages ? (
          <Link href={hrefFor(filters.page + 1)} className="btn btn-primary">
            {t("next")}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
