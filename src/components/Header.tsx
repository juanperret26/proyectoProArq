import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { CATEGORY_TAXONOMY } from "@/lib/catalog/taxonomy";
import { pickLocalized } from "@/lib/i18n/localized";
import { LanguageToggle } from "./LanguageToggle";
import { Logo } from "./Logo";
import { SearchForm } from "./SearchForm";

const RAIL_LINK =
  "block whitespace-nowrap py-3 text-[0.9375rem] leading-5 underline-offset-4 hover:text-blueline hover:underline lg:text-sm lg:leading-5";

/**
 * Encabezado del sitio. Arriba: marca, buscador, herramientas, ingreso e
 * idioma. Abajo: la barra de rubros. En pantallas chicas las herramientas
 * (asistente y comparador) pasan a la barra, que se desliza de lado.
 */
export async function Header() {
  const t = await getTranslations("header");
  const locale = await getLocale();

  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-x-6">
        <Link href="/" aria-label={t("home")} className="shrink-0">
          <Logo />
        </Link>
        <div className="order-last w-full lg:order-none lg:w-auto lg:flex-1">
          <SearchForm />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Link href="/assistant" className="btn btn-quiet max-lg:hidden">
            {t("assistant")}
          </Link>
          <Link href="/compare" className="btn btn-quiet max-lg:hidden">
            {t("compare")}
          </Link>
          <Link href="/login" className="btn btn-quiet">
            {t("signIn")}
          </Link>
          <Suspense fallback={<span className="inline-block h-11 w-24" aria-hidden="true" />}>
            <LanguageToggle />
          </Suspense>
        </div>
      </div>

      <nav aria-label={t("railNav")} className="border-t border-rule">
        <ul className="mx-auto flex max-w-[1240px] gap-x-5 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden">
          <li className="lg:hidden">
            <Link href="/assistant" className={`${RAIL_LINK} font-semibold`}>
              {t("assistant")}
            </Link>
          </li>
          <li className="lg:hidden">
            <Link href="/compare" className={`${RAIL_LINK} font-semibold`}>
              {t("compare")}
            </Link>
          </li>
          <li
            aria-hidden="true"
            className="my-2.5 w-px shrink-0 bg-rule lg:hidden"
          />
          {CATEGORY_TAXONOMY.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/categories/${category.slug}`}
                className={`${RAIL_LINK} text-ink-soft`}
              >
                {pickLocalized(locale, category.nameEn, category.nameEs)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
