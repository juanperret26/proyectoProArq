import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORY_TAXONOMY } from "@/lib/catalog/taxonomy";
import { pickLocalized } from "@/lib/i18n/localized";
import { Logo } from "./Logo";

const FOOTER_LINK = "underline-offset-4 hover:text-blueline hover:underline";

/** Pie del sitio, armado como el rótulo de un plano: celdas separadas por líneas. */
export async function Footer() {
  const t = await getTranslations("footer");
  const tHeader = await getTranslations("header");
  const locale = await getLocale();

  return (
    <footer className="border-t border-ink">
      <div className="mx-auto grid max-w-[1240px] px-4 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_minmax(0,2fr)]">
        <div className="border-b border-rule py-9 md:border-b-0 md:border-r md:pr-10">
          <Logo />
          <p className="mt-4 max-w-[40ch] text-ink-soft">{t("about")}</p>
          <p className="mt-3 max-w-[40ch] text-[0.9375rem] text-redline">
            {t("sample")}
          </p>
        </div>

        <nav
          aria-labelledby="footer-materials"
          className="border-b border-rule py-9 md:border-b-0 md:border-r md:px-10"
        >
          <h2 id="footer-materials" className="font-semibold">
            {t("materials")}
          </h2>
          <ul className="mt-3 grid gap-x-8 gap-y-2 text-[0.9375rem] sm:grid-cols-2">
            {CATEGORY_TAXONOMY.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categories/${category.slug}`}
                  className={FOOTER_LINK}
                >
                  {pickLocalized(locale, category.nameEn, category.nameEs)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-tools" className="py-9 md:pl-10">
          <h2 id="footer-tools" className="font-semibold">
            {t("tools")}
          </h2>
          <ul className="mt-3 grid gap-y-2 text-[0.9375rem]">
            <li>
              <Link href="/assistant" className={FOOTER_LINK}>
                {tHeader("assistant")}
              </Link>
            </li>
            <li>
              <Link href="/compare" className={FOOTER_LINK}>
                {tHeader("compare")}
              </Link>
            </li>
            <li>
              <Link href="/sign-in" className={FOOTER_LINK}>
                {tHeader("signIn")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
