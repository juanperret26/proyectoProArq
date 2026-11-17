import Form from "next/form";
import { getLocale, getTranslations } from "next-intl/server";
import { Search } from "lucide-react";

/** Buscador del encabezado: envía la consulta a la página de resultados. */
export async function SearchForm() {
  const t = await getTranslations("search");
  const locale = await getLocale();

  return (
    <Form action={`/${locale}/search`} role="search" className="flex h-11 w-full">
      <label className="min-w-0 flex-1">
        <span className="sr-only">{t("label")}</span>
        <input
          type="search"
          name="q"
          placeholder={t("placeholder")}
          autoComplete="off"
          enterKeyHint="search"
          className="h-full w-full rounded-l-control border border-r-0 border-rule-strong bg-paper px-3.5 text-ink placeholder:text-ink-soft focus-visible:border-blueline focus-visible:outline-offset-0"
        />
      </label>
      <button
        type="submit"
        className="inline-flex h-full shrink-0 items-center gap-2 rounded-r-control bg-blueline px-4 font-semibold text-paper hover:bg-blueline-deep"
      >
        <Search className="size-[18px]" aria-hidden="true" />
        <span className="max-sm:sr-only">{t("submit")}</span>
      </button>
    </Form>
  );
}
