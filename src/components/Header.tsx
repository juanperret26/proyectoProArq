import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { CompareNavLink } from "@/components/compare/CompareNavLink";
import { Link } from "@/i18n/navigation";
import { CATEGORY_TAXONOMY } from "@/lib/catalog/taxonomy";
import { pickLocalized } from "@/lib/i18n/localized";
import { AuthNav } from "./AuthNav";
import { CategoryMenu } from "./CategoryMenu";
import { LanguageToggle } from "./LanguageToggle";
import { Logo } from "./Logo";
import { SearchForm } from "./SearchForm";

const MENU_TOOL_LINK =
  "block py-2.5 text-[0.9375rem] leading-5 underline-offset-4 hover:text-blueline hover:underline";

/**
 * Encabezado del sitio: menú de tres líneas con todos los rubros, marca,
 * buscador, herramientas, ingreso e idioma. En pantallas chicas las
 * herramientas (asistente y comparador) pasan al menú.
 */
export async function Header() {
  const t = await getTranslations("header");
  const locale = await getLocale();
  const categoryItems = CATEGORY_TAXONOMY.map((category) => ({
    slug: category.slug,
    label: pickLocalized(locale, category.nameEn, category.nameEs),
  }));

  return (
    <header className="relative border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-5 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-x-6">
        <CategoryMenu
          items={categoryItems}
          openLabel={t("openMenu")}
          closeLabel={t("closeMenu")}
          navLabel={t("railNav")}
        >
          <li>
            <Link
              href="/assistant"
              className={`${MENU_TOOL_LINK} flex items-center gap-2 font-medium text-blueline`}
            >
              <Sparkles className="size-4 shrink-0 text-blueline" aria-hidden="true" />
              <span>{t("assistant")}</span>
            </Link>
          </li>
          <li>
            <CompareNavLink className={MENU_TOOL_LINK}>
              {t("compare")}
            </CompareNavLink>
          </li>
        </CategoryMenu>
        <Link href="/" aria-label={t("home")} className="shrink-0">
          <Logo />
        </Link>
        <div className="order-last w-full lg:order-none lg:w-auto lg:flex-1">
          <SearchForm />
        </div>
        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <Link
            href="/assistant"
            className="btn btn-primary gap-1.5 px-3 max-lg:hidden"
          >
            <Sparkles className="size-4 shrink-0" aria-hidden="true" />
            <span>{t("assistant")}</span>
          </Link>
          <CompareNavLink className="btn btn-quiet max-lg:hidden">
            {t("compare")}
          </CompareNavLink>
          <AuthNav />
          <Suspense fallback={<span className="inline-block h-11 w-24" aria-hidden="true" />}>
            <LanguageToggle />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
