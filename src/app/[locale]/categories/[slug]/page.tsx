import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { CatalogResults, ResultsSkeleton } from "@/components/catalog/CatalogResults";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { Link } from "@/i18n/navigation";
import { allCategorySlugs, lookupCategory } from "@/lib/catalog/category-lookup";
import { parseSearchFilters, type RawSearchParams } from "@/lib/catalog/filters";
import { pickLocalized } from "@/lib/i18n/localized";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

export function generateStaticParams(): Array<{ slug: string }> {
  return allCategorySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const match = lookupCategory(slug);
  if (!match) return {};
  return {
    title: pickLocalized(await getLocale(), match.entry.nameEn, match.entry.nameEs),
  };
}

export default function CategoryPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
          <ResultsSkeleton />
        </div>
      }
    >
      <CategoryContent {...props} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: Props) {
  const { slug } = await params;
  const match = lookupCategory(slug);
  if (!match) notFound();

  const [locale, t, home] = await Promise.all([
    getLocale(),
    getTranslations("catalog"),
    getTranslations("header"),
  ]);
  const name = pickLocalized(locale, match.entry.nameEn, match.entry.nameEs);
  const crumbs = [
    { label: home("home"), href: "/" },
    ...(match.parent
      ? [
          {
            label: pickLocalized(locale, match.parent.nameEn, match.parent.nameEs),
            href: `/categories/${match.parent.slug}`,
          },
        ]
      : []),
    { label: name },
  ];
  const children = match.parent ? [] : match.top.children;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <Breadcrumb items={crumbs} />
      <header className="mt-5 flex items-center gap-5">
        <CategoryGlyph glyph={match.top.glyph} className="size-16 text-blueline" />
        <h1 className="text-balance font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-extrabold leading-none">
          {name}
        </h1>
      </header>

      {children.length > 0 ? (
        <nav aria-label={t("subcategories", { category: name })} className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {children.map((child) => (
              <li key={child.slug}>
                <Link
                  href={`/categories/${child.slug}`}
                  className="btn btn-outline min-h-10"
                >
                  {pickLocalized(locale, child.nameEn, child.nameEs)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="mt-8">
        <Suspense fallback={<ResultsSkeleton />}>
          <CategoryResults slug={slug} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function CategoryResults({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseSearchFilters(await searchParams);
  return (
    <CatalogResults
      filters={filters}
      basePath={`/categories/${slug}`}
      category={slug}
      hidden={filters.q ? { q: filters.q } : {}}
    />
  );
}
