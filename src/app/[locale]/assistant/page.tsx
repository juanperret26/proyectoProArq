import type { Metadata } from "next";
import Form from "next/form";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AssistantResults } from "@/components/assistant/AssistantResults";
import { ResultsSkeleton } from "@/components/catalog/CatalogResults";
import { Link } from "@/i18n/navigation";
import { MAX_QUERY_LENGTH } from "@/lib/assistant/parse";
import type { RawSearchParams } from "@/lib/catalog/filters";
import { alternatesFor, siteUrl } from "@/lib/seo/site";

type Props = {
  searchParams: Promise<RawSearchParams>;
};

const EXAMPLE_KEYS = ["tiles", "cement", "lighting", "toilets"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "assistant" });
  return { title: t("title"), alternates: alternatesFor(siteUrl(), locale, "/assistant") };
}

export default function AssistantPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <Suspense fallback={<ResultsSkeleton />}>
        <AssistantContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function readQuery(raw: RawSearchParams): string | null {
  const value = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  const text = value?.trim().slice(0, MAX_QUERY_LENGTH).trim();
  return text ? text : null;
}

async function AssistantContent({ searchParams }: Props) {
  const query = readQuery(await searchParams);
  const [t, locale] = await Promise.all([getTranslations("assistant"), getLocale()]);

  return (
    <>
      <header className="max-w-[60ch]">
        <h1 className="text-balance font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-extrabold leading-none">
          {t("title")}
        </h1>
        <p className="mt-4 text-ink-soft">{t("lead")}</p>
      </header>

      <Form action={`/${locale}/assistant`} className="mt-8 max-w-[52rem]">
        <label htmlFor="assistant-q" className="font-semibold">
          {t("label")}
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="assistant-q"
            type="search"
            name="q"
            defaultValue={query ?? ""}
            maxLength={MAX_QUERY_LENGTH}
            placeholder={t("placeholder")}
            autoComplete="off"
            enterKeyHint="search"
            aria-describedby="assistant-hint"
            className="h-12 min-w-0 flex-1 rounded-control border border-rule-strong bg-paper px-3.5 text-ink placeholder:text-ink-soft focus-visible:border-blueline focus-visible:outline-offset-0"
          />
          <button type="submit" className="btn btn-primary h-12">
            {t("submit")}
          </button>
        </div>
        <p id="assistant-hint" className="mt-2 text-[0.875rem] text-ink-soft">
          {t("hint", { max: MAX_QUERY_LENGTH })}
        </p>
      </Form>

      <nav aria-labelledby="assistant-examples" className="mt-6">
        <h2 id="assistant-examples" className="text-[0.875rem] font-semibold text-ink-soft">
          {t("examplesTitle")}
        </h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {EXAMPLE_KEYS.map((key) => {
            const example = t(`examples.${key}`);
            return (
              <li key={key}>
                <Link
                  href={{ pathname: "/assistant", query: { q: example } }}
                  className="inline-block rounded-control border border-rule px-3 py-1.5 text-[0.9375rem] hover:border-blueline hover:text-blueline"
                >
                  {example}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {query ? (
        <Suspense key={query} fallback={<ResultsSkeleton />}>
          <AssistantResults query={query} />
        </Suspense>
      ) : null}
    </>
  );
}
