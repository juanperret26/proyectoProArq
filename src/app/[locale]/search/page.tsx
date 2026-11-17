import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CatalogResults, ResultsSkeleton } from "@/components/catalog/CatalogResults";
import { parseSearchFilters, type RawSearchParams } from "@/lib/catalog/filters";

type Props = {
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "catalog" });
  return { title: t("searchTitle") };
}

export default function SearchPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <Suspense fallback={<ResultsSkeleton />}>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchContent({ searchParams }: Props) {
  const filters = parseSearchFilters(await searchParams);
  const t = await getTranslations("catalog");
  const title = filters.q ? t("searchTitleFor", { query: filters.q }) : t("allMaterials");
  const hidden: Record<string, string> = {
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.category ? { category: filters.category } : {}),
  };

  return (
    <>
      <h1 className="mb-8 text-balance font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-extrabold leading-none">
        {title}
      </h1>
      <CatalogResults
        filters={filters}
        basePath="/search"
        category={null}
        hidden={hidden}
      />
    </>
  );
}
