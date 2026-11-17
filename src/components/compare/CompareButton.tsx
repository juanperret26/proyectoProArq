"use client";

import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { MAX_COMPARE_ITEMS } from "@/lib/compare/items";

import { useCompareList } from "./compare-store";

type Props = {
  id: string;
  name: string;
  /** Se antepone al nombre guardado: varios proveedores venden productos con el mismo nombre. */
  supplierName: string;
};

/** Agrega o quita un producto de la comparación. Va sobre el enlace de la tarjeta. */
export function CompareButton({ id, name, supplierName }: Props) {
  const t = useTranslations("compare");
  const { has, add, remove, isFull } = useCompareList();
  const selected = has(id);
  const blocked = !selected && isFull;
  const fullId = `compare-full-${id}`;

  function handleClick(): void {
    if (blocked) return;
    if (selected) remove(id);
    else add({ id, name: `${supplierName} · ${name}` });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={selected}
        aria-disabled={blocked}
        aria-describedby={blocked ? fullId : undefined}
        aria-label={`${t("add")}: ${name}`}
        className={`relative z-10 inline-flex min-h-10 items-center gap-1.5 rounded-control border px-3 text-[0.9375rem] font-semibold aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${
          selected
            ? "border-blueline bg-blueline text-paper"
            : "border-rule-strong bg-paper text-ink hover:border-blueline hover:text-blueline"
        }`}
      >
        {selected ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Plus className="size-4" aria-hidden="true" />
        )}
        {t("add")}
      </button>
      {blocked ? (
        <span id={fullId} className="sr-only">
          {t("full", { max: MAX_COMPARE_ITEMS })}
        </span>
      ) : null}
    </>
  );
}
