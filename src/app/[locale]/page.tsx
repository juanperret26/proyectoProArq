import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FeaturedProducts } from "@/components/catalog/FeaturedProducts";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { Link } from "@/i18n/navigation";
import { CATEGORY_TAXONOMY } from "@/lib/catalog/taxonomy";
import { pickLocalized } from "@/lib/i18n/localized";

const STEP_KEYS = ["search", "compare", "quote"] as const;

/** Separación entre el trazado de un símbolo y el siguiente, en milisegundos. */
const PLOT_STAGGER_MS = 70;

export default async function HomePage() {
  const t = await getTranslations("home");
  const locale = await getLocale();

  return (
    <>
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-[1240px] gap-x-14 gap-y-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] lg:items-center lg:pb-24 lg:pt-20">
          <div>
            <h1 className="text-balance font-display text-[clamp(3rem,1.75rem+5vw,5.25rem)] font-extrabold leading-[0.9]">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-[46ch] text-[1.1875rem] leading-normal text-ink-soft">
              {t("lead")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <a href="#materials" className="btn btn-primary">
                {t("browse")}
              </a>
              <Link href="/assistant" className="link-text">
                {t("describe")}
              </Link>
            </div>
          </div>

          <nav
            id="materials"
            aria-labelledby="legend-title"
            className="scroll-mt-8"
          >
            <h2 id="legend-title" className="font-semibold">
              {t("legendTitle")}
            </h2>
            <ul className="mt-3 grid grid-cols-2 border-l border-t border-blueline sm:grid-cols-4">
              {CATEGORY_TAXONOMY.map((category, index) => (
                <li
                  key={category.slug}
                  className="border-b border-r border-blueline"
                >
                  <Link
                    href={`/categories/${category.slug}`}
                    className="group flex h-full flex-col justify-between gap-5 p-4 hover:bg-vellum focus-visible:bg-vellum focus-visible:-outline-offset-2 sm:p-5"
                  >
                    <CategoryGlyph
                      glyph={category.glyph}
                      className="size-[68px] animate-plot text-blueline sm:size-[76px]"
                      style={{ animationDelay: `${index * PLOT_STAGGER_MS}ms` }}
                    />
                    <span className="font-semibold leading-tight underline-offset-4 group-hover:underline">
                      {pickLocalized(locale, category.nameEn, category.nameEs)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <Suspense fallback={null}>
        <FeaturedProducts />
      </Suspense>

      <section
        aria-labelledby="steps-title"
        className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6 lg:py-20"
      >
        <h2
          id="steps-title"
          className="font-display text-[2.25rem] font-bold leading-none"
        >
          {t("stepsTitle")}
        </h2>
        <ol className="mt-8 grid border-t border-ink sm:grid-cols-3">
          {STEP_KEYS.map((key, index) => (
            <li
              key={key}
              className="border-b border-rule py-6 sm:border-b-0 sm:border-r sm:px-7 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
            >
              <span className="font-display text-[3rem] font-bold leading-none text-blueline tabular-nums">
                {index + 1}
              </span>
              <h3 className="mt-3 text-[1.1875rem] font-semibold leading-snug">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="mt-2 max-w-[38ch] text-ink-soft">
                {t(`steps.${key}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
