"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { MAX_COMPARE_ITEMS, toCompareHref } from "@/lib/compare/items";

import { useCompareList } from "./compare-store";

/**
 * Para /compare sin `ids` en la URL: si hay productos guardados en el
 * navegador, ofrece abrir su comparación; si no, explica cómo empezar.
 */
export function CompareFromStorage() {
  const t = useTranslations("compare");
  const { items } = useCompareList();

  if (items.length > 0) {
    return (
      <div className="border border-ink p-8">
        <h2 className="font-display text-[1.75rem] font-bold leading-tight">
          {t("selected", { count: items.length, max: MAX_COMPARE_ITEMS })}
        </h2>
        <Link
          href={toCompareHref(items.map((item) => item.id))}
          className="btn btn-primary mt-5"
        >
          {t("compareNow")}
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-dashed border-rule-strong p-8">
      <h2 className="font-display text-[1.75rem] font-bold leading-tight">
        {t("emptyTitle")}
      </h2>
      <p className="mt-2 max-w-[52ch] text-ink-soft">{t("emptyBody")}</p>
      <Link href="/search" className="btn btn-primary mt-5">
        {t("browse")}
      </Link>
    </div>
  );
}
