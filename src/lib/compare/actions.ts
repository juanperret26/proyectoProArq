"use server";

import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";
import { geminiConfig, reserveAiUse } from "@/lib/ai/quota";
import { getUserDb } from "@/lib/supabase/user-client";

import type { ComparisonAnalysis } from "./analysis";
import { analyzeProducts } from "./analyze";
import { parseCompareIds } from "./items";

export type AnalysisState =
  | { status: "idle" }
  | { status: "ok"; analysis: ComparisonAnalysis }
  | { status: "signIn" }
  | { status: "limit" }
  | { status: "unavailable" }
  | { status: "invalid" };

const MIN_PRODUCTS = 2;

/** Pide a la IA un análisis de los productos comparados. Exige sesión y gasta cuota. */
export async function analyzeComparison(
  _prev: AnalysisState,
  formData: FormData,
): Promise<AnalysisState> {
  const rawIds = formData.get("ids");
  const ids = parseCompareIds(typeof rawIds === "string" ? rawIds : undefined);
  if (ids.length < MIN_PRODUCTS) return { status: "invalid" };
  const rawLocale = formData.get("locale");
  const locale = hasLocale(routing.locales, rawLocale) ? rawLocale : routing.defaultLocale;

  const config = geminiConfig();
  if (!config) return { status: "unavailable" };
  const user = await getUserDb();
  if (!user) return { status: "signIn" };

  const reservation = await reserveAiUse(user, {
    query: `compare:${ids.join(",")}`,
    locale,
    model: config.model,
  });
  if (reservation === "limit") return { status: "limit" };
  if (reservation === "error") return { status: "unavailable" };

  const analysis = await analyzeProducts(ids, locale);
  return analysis ? { status: "ok", analysis } : { status: "unavailable" };
}
