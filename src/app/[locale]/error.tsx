"use client";

import { useTranslations } from "next-intl";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Se muestra si falla la carga de datos de una página (p. ej. la base no responde). */
export default function LocaleError({ reset }: Props) {
  const t = useTranslations("error");

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
      <h1 className="font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-extrabold leading-none">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-[52ch] text-ink-soft">{t("body")}</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-6">
        {t("retry")}
      </button>
    </div>
  );
}
