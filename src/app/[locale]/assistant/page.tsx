import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AssistantComposer } from "@/components/assistant/AssistantComposer";
import { AssistantResults } from "@/components/assistant/AssistantResults";
import { ResultsSkeleton } from "@/components/catalog/CatalogResults";
import { Link } from "@/i18n/navigation";
import { MAX_QUERY_LENGTH } from "@/lib/assistant/parse";
import type { RawSearchParams } from "@/lib/catalog/filters";
import { alternatesFor, siteUrl } from "@/lib/seo/site";

type Props = {
  searchParams: Promise<RawSearchParams>;
};

const EXAMPLE_KEYS = [
  "tiles",
  "cement",
  "lighting",
  "toilets",
  "scaffolding",
  "steel",
  "pipes",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "assistant" });
  return { title: t("title"), alternates: alternatesFor(siteUrl(), locale, "/assistant") };
}

export default function AssistantPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div className="assistant-page min-h-[60svh]" aria-busy="true" />}>
      <AssistantContent searchParams={searchParams} />
    </Suspense>
  );
}

function readQuery(raw: RawSearchParams): string | null {
  const value = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  const text = value?.trim().slice(0, MAX_QUERY_LENGTH).trim();
  return text ? text : null;
}

/**
 * Pantalla tipo chat: sin pedido, título y caja al centro; con pedido, las
 * recomendaciones quedan arriba y la caja de texto debajo de ellas.
 */
async function AssistantContent({ searchParams }: Props) {
  const query = readQuery(await searchParams);
  const [t, locale] = await Promise.all([getTranslations("assistant"), getLocale()]);

  return (
    <section
      className={`assistant-page flex min-h-[calc(100svh-9rem)] flex-col px-4 pb-14 pt-10 sm:px-6 ${
        query ? "justify-end" : "justify-center"
      }`}
    >
      {query ? (
        <>
          <h1 className="sr-only">{t("title")}</h1>
          <div className="mx-auto mb-10 w-full max-w-[1240px]">
            <Suspense key={query} fallback={<ResultsSkeleton />}>
              <AssistantResults query={query} />
            </Suspense>
          </div>
        </>
      ) : (
        <header className="mx-auto mb-8 text-center">
          <h1 className="text-balance text-[clamp(2.25rem,1.5rem+2.4vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.04em] text-[#1c1c1c]">
            {t("title")}
          </h1>
          {t.has("lead") ? (
            <p className="mx-auto mt-3 max-w-[52ch] text-balance text-[1.125rem] text-[#6b6b66]">
              {t("lead")}
            </p>
          ) : null}
        </header>
      )}

      <div className="mx-auto w-full max-w-[38rem]">
        <AssistantComposer
          action={`/${locale}/assistant`}
          defaultValue={query ?? ""}
          placeholder={t("placeholder")}
          label={t.has("label") ? t("label") : t("title")}
          submitLabel={t("submit")}
          clearLabel={t("clear")}
          hint={t("hint", { max: MAX_QUERY_LENGTH })}
          maxLength={MAX_QUERY_LENGTH}
        />

        <nav aria-labelledby="assistant-examples" className="mt-6 text-center">
          <h2 id="assistant-examples" className="text-[0.875rem] font-semibold text-[#6b6b66]">
            {t("examplesTitle")}
          </h2>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {EXAMPLE_KEYS.map((key) => {
              const example = t(`examples.${key}`);
              return (
                <li key={key}>
                  <Link
                    href={{ pathname: "/assistant", query: { q: example } }}
                    className="inline-block rounded-full bg-white/80 px-4 py-2 text-[0.9375rem] text-[#1c1c1c] shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-blueline hover:ring-blueline"
                  >
                    {example}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
}
