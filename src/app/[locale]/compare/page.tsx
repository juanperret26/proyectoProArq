import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CompareFromStorage } from "@/components/compare/CompareFromStorage";
import { CompareTable } from "@/components/compare/CompareTable";
import { Link } from "@/i18n/navigation";
import { getProductsByIds } from "@/lib/catalog/queries";
import { COMPARE_TITLE_ID, parseCompareIds } from "@/lib/compare/items";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "compare" });
  return { title: t("title") };
}

export default function ComparePage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse bg-vellum" />}>
        <CompareContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CompareContent({ searchParams }: Props) {
  const ids = parseCompareIds((await searchParams).ids);
  const t = await getTranslations("compare");

  return (
    <>
      <h1
        id={COMPARE_TITLE_ID}
        tabIndex={-1}
        className="mb-8 text-balance focus-visible:outline-none font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-extrabold leading-none">
        {t("title")}
      </h1>
      {ids.length === 0 ? <CompareFromStorage /> : <CompareResult ids={ids} />}
    </>
  );
}

async function CompareResult({ ids }: { ids: string[] }) {
  const [products, t] = await Promise.all([getProductsByIds(ids), getTranslations("compare")]);

  if (products.length === 0) {
    return (
      <div className="border border-dashed border-rule-strong p-8">
        <h2 className="font-display text-[1.75rem] font-bold leading-tight">
          {t("notFoundTitle")}
        </h2>
        <p className="mt-2 max-w-[52ch] text-ink-soft">{t("notFoundBody")}</p>
        <Link href="/search" className="btn btn-primary mt-5">
          {t("browse")}
        </Link>
      </div>
    );
  }

  return (
    <>
      {products.length < 2 ? (
        <p className="mb-4 max-w-[60ch] text-ink-soft">{t("addOneMore")}</p>
      ) : null}
      <CompareTable products={products} />
      <p className="mt-4">
        <Link href="/search" className="link-text">
          {t("browse")}
        </Link>
      </p>
    </>
  );
}
