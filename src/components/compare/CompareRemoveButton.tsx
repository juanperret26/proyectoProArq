"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { COMPARE_TITLE_ID, toCompareHref } from "@/lib/compare/items";

import { useCompareList } from "./compare-store";

type Props = {
  id: string;
  name: string;
  /** Ids que quedan en la comparación después de quitar este. */
  remainingIds: readonly string[];
};

/** Quita un producto de la tabla: actualiza la lista guardada y la URL. */
export function CompareRemoveButton({ id, name, remainingIds }: Props) {
  const t = useTranslations("compare");
  const router = useRouter();
  const { remove } = useCompareList();

  function handleClick(): void {
    remove(id);
    router.replace(toCompareHref(remainingIds));
    // Este botón desaparece al quitar la columna: el foco pasa al título de la página.
    document.getElementById(COMPARE_TITLE_ID)?.focus();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${t("remove")}: ${name}`}
      className="link-text text-[0.875rem]"
    >
      {t("remove")}
    </button>
  );
}
