"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * Botón que traduce todo el sitio: alterna entre inglés y español
 * conservando la página actual y sus filtros.
 */
export function LanguageToggle() {
  const t = useTranslations("language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const nextLocale: Locale = locale === "en" ? "es" : "en";

  function handleToggle() {
    const href = `${pathname}${window.location.search}`;
    startTransition(() => {
      router.replace(href, { locale: nextLocale });
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={t("switchTo")}
      lang={nextLocale}
      className="btn btn-outline"
    >
      <Languages className="size-4" aria-hidden="true" />
      {t("target")}
    </button>
  );
}
