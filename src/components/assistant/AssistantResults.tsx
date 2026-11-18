import { getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/catalog/ProductCard";
import { Link } from "@/i18n/navigation";
import { recommend } from "@/lib/assistant/recommend";
import { toCompareHref } from "@/lib/compare/items";

import { CriteriaSummary } from "./CriteriaSummary";

type Props = {
  query: string;
};

/** Mensaje cuando el pedido no tiene nada del catálogo: no se consulta la base. */
async function OffTopic() {
  const t = await getTranslations("assistant");
  return (
    <div role="status" className="mt-10 max-w-[60ch] border border-dashed border-rule-strong p-8">
      <h2 className="font-display text-[1.75rem] font-bold leading-tight">
        {t("offTopicTitle")}
      </h2>
      <p className="mt-2 text-ink-soft">{t("offTopicBody")}</p>
    </div>
  );
}

export async function AssistantResults({ query }: Props) {
  const [result, t] = await Promise.all([recommend(query), getTranslations("assistant")]);
  if (result.status === "offTopic") return <OffTopic />;

  const { parsed, items, total, catalogHref } = result;
  const compareHref = toCompareHref(items.slice(0, 4).map((item) => item.product.id));

  return (
    <section aria-labelledby="assistant-results" className="mt-10">
      <CriteriaSummary parsed={parsed} />

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="assistant-results" className="font-display text-[1.75rem] font-bold leading-tight">
          {t("resultsTitle", { count: items.length, total })}
        </h2>
        <div className="flex flex-wrap gap-3">
          {items.length > 1 ? (
            <Link href={compareHref} className="btn btn-primary">
              {t("compareTop", { count: Math.min(items.length, 4) })}
            </Link>
          ) : null}
          <Link href={catalogHref} className="btn btn-outline">
            {t("adjustInCatalog")}
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 border border-dashed border-rule-strong p-8">
          <p className="font-semibold">{t("noResultsTitle")}</p>
          <p className="mt-2 max-w-[48ch] text-ink-soft">{t("noResultsBody")}</p>
        </div>
      ) : (
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ product, reasons }) => (
            <li key={product.id} className="flex flex-col">
              <ProductCard product={product} />
              {reasons.length > 0 ? (
                <ul
                  aria-label={t("reasonsLabel")}
                  className="flex flex-wrap gap-1.5 border border-t-0 border-rule bg-vellum p-3 text-[0.8125rem]"
                >
                  {reasons.map((code) => (
                    <li
                      key={code}
                      className={
                        code === "minOrderAboveQuantity"
                          ? "rounded-control border border-redline px-2 py-0.5 text-redline"
                          : "rounded-control border border-rule-strong px-2 py-0.5"
                      }
                    >
                      {t(`reasons.${code}`)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
