import "server-only";

import { cacheLife } from "next/cache";

import { createGeminiClient } from "@/lib/ai/gemini";
import { geminiConfig } from "@/lib/ai/quota";
import { getProductsByIds } from "@/lib/catalog/queries";

import {
  ANALYSIS_RESPONSE_SCHEMA,
  buildAnalysisPrompt,
  parseAnalysis,
  toAnalysisInput,
  type ComparisonAnalysis,
} from "./analysis";

/** Marca de una falla esperada; los errores que salen de "use cache" no conservan su clase. */
const ANALYSIS_FAILED = "analysis-failed";

/**
 * Analiza la comparación y la guarda por productos e idioma: dos personas que
 * comparan lo mismo comparten la respuesta. Las fallas no quedan en caché.
 */
async function analyzeCached(sortedIds: readonly string[], locale: string): Promise<ComparisonAnalysis> {
  "use cache";
  cacheLife("hours");
  const config = geminiConfig();
  const products = await getProductsByIds(sortedIds);
  if (!config || products.length < 2) throw new Error(ANALYSIS_FAILED);

  const facts = toAnalysisInput(products, locale);
  const raw = await createGeminiClient(config).generateJson(
    buildAnalysisPrompt(facts, locale),
    ANALYSIS_RESPONSE_SCHEMA,
  );
  const analysis = parseAnalysis(raw, facts.map((fact) => fact.id));
  if (!analysis) throw new Error(ANALYSIS_FAILED);
  return analysis;
}

/** Análisis de los productos, o null si el modelo falló. */
export async function analyzeProducts(
  ids: readonly string[],
  locale: string,
): Promise<ComparisonAnalysis | null> {
  try {
    return await analyzeCached(ids.toSorted(), locale);
  } catch (error) {
    const expected = error instanceof Error && error.message === ANALYSIS_FAILED;
    if (!expected) console.error("analyzeProducts", error);
    return null;
  }
}
