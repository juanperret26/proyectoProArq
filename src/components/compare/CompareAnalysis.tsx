"use client";

import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Link } from "@/i18n/navigation";
import { analyzeComparison, type AnalysisState } from "@/lib/compare/actions";
import type { ComparisonAnalysis } from "@/lib/compare/analysis";

type Props = {
  ids: readonly string[];
  /** Nombre visible de cada producto, por id. */
  names: Readonly<Record<string, string>>;
  dailyLimit: number;
};

const INITIAL: AnalysisState = { status: "idle" };

function OptionCard({
  option,
  name,
  isBest,
}: {
  option: ComparisonAnalysis["options"][number];
  name: string;
  isBest: boolean;
}) {
  const t = useTranslations("compare.ai");
  return (
    <li
      className={`flex flex-col border bg-paper p-4 ${isBest ? "border-blueline" : "border-rule"}`}
    >
      <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-blueline">
        {isBest ? `${t("bestOverall")} · ` : ""}
        {t(`verdicts.${option.verdict}`)}
      </p>
      <h3 className="mt-1 font-semibold leading-snug">{name}</h3>
      <div className="mt-3 grid gap-3 text-[0.9375rem]">
        {option.pros.length > 0 ? (
          <div>
            <h4 className="text-[0.8125rem] text-ink-soft">{t("pros")}</h4>
            <ul className="mt-1 list-disc pl-5">
              {option.pros.map((pro) => (
                <li key={pro}>{pro}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {option.cons.length > 0 ? (
          <div>
            <h4 className="text-[0.8125rem] text-ink-soft">{t("cons")}</h4>
            <ul className="mt-1 list-disc pl-5 text-redline">
              {option.cons.map((con) => (
                <li key={con}>{con}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function AnalysisResult({
  analysis,
  names,
}: {
  analysis: ComparisonAnalysis;
  names: Props["names"];
}) {
  const t = useTranslations("compare.ai");
  return (
    <div className="mt-5">
      <p className="max-w-[70ch]">{analysis.summary}</p>
      <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analysis.options.map((option) => (
          <OptionCard
            key={option.productId}
            option={option}
            name={names[option.productId] ?? option.productId}
            isBest={option.productId === analysis.bestOverall}
          />
        ))}
      </ul>
      <p className="mt-5 max-w-[70ch] font-semibold">{analysis.advice}</p>
      <p className="mt-3 text-[0.8125rem] text-ink-soft">{t("disclaimer")}</p>
    </div>
  );
}

/** Análisis de compra con IA: se pide con un clic y gasta una consulta de la cuota diaria. */
export function CompareAnalysis({ ids, names, dailyLimit }: Props) {
  const t = useTranslations("compare.ai");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(analyzeComparison, INITIAL);

  return (
    <section aria-labelledby="compare-ai-title" className="mt-10 border border-rule bg-vellum p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[60ch]">
          <h2 id="compare-ai-title" className="font-display text-[1.5rem] font-bold leading-tight">
            {t("title")}
          </h2>
          <p className="mt-1 text-ink-soft">{t("lead", { limit: dailyLimit })}</p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="ids" value={ids.join(",")} />
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" disabled={pending} className="btn btn-primary gap-2">
            <Sparkles className="size-4" aria-hidden="true" />
            {pending ? t("analyzing") : state.status === "ok" ? t("again") : t("analyze")}
          </button>
        </form>
      </div>

      <div role="status" aria-live="polite">
        {state.status === "ok" ? <AnalysisResult analysis={state.analysis} names={names} /> : null}
        {state.status === "signIn" ? (
          <p className="mt-4">
            {t("signIn")}{" "}
            <Link href="/sign-in" className="link-text">
              {t("signInLink")}
            </Link>
          </p>
        ) : null}
        {state.status === "limit" ? <p className="mt-4">{t("limit", { limit: dailyLimit })}</p> : null}
        {state.status === "unavailable" || state.status === "invalid" ? (
          <p className="mt-4 text-redline">{t("unavailable")}</p>
        ) : null}
      </div>
    </section>
  );
}
