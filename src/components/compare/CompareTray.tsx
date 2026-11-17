"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { MAX_COMPARE_ITEMS, toCompareHref } from "@/lib/compare/items";

import { useCompareList } from "./compare-store";

/** Bandeja fija al pie con los productos elegidos; se oculta si no hay ninguno. */
export function CompareTray() {
  const t = useTranslations("compare");
  const { items, remove, clear } = useCompareList();

  const status = (
    <p role="status" className="sr-only">
      {items.length > 0 ? t("selected", { count: items.length, max: MAX_COMPARE_ITEMS }) : ""}
    </p>
  );
  if (items.length === 0) return status;

  return (
    <>
      {status}
      <section
        aria-label={t("trayLabel")}
        className="sticky bottom-0 z-40 border-t border-ink bg-paper shadow-[0_-6px_18px_rgba(21,25,77,0.08)]"
      >
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <p className="font-semibold tabular-nums">
            {t("selected", { count: items.length, max: MAX_COMPARE_ITEMS })}
          </p>
          <ul className="flex max-h-24 min-w-0 flex-1 flex-wrap gap-2 overflow-y-auto">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex max-w-[16rem] items-center gap-1 rounded-control border border-rule-strong bg-vellum pl-3"
              >
                <span title={item.name} className="truncate text-[0.9375rem]">
                  {item.name}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`${t("remove")}: ${item.name}`}
                  className="inline-flex size-9 shrink-0 items-center justify-center hover:text-redline"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <button type="button" onClick={clear} className="link-text">
              {t("clear")}
            </button>
            <Link
              href={toCompareHref(items.map((item) => item.id))}
              className="btn btn-primary"
            >
              {t("compareNow")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
