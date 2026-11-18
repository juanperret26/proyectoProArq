import "server-only";

import { cacheLife } from "next/cache";

import { geminiConfig, reserveAiUse } from "@/lib/ai/quota";
import { getUserDb } from "@/lib/supabase/user-client";

import type { ExtractedCriteria } from "./extract";
import { createGeminiExtractor } from "./gemini";
import type { AiFallback, AiOutcome } from "./recommend";

export { DAILY_AI_LIMIT } from "@/lib/ai/quota";

/** Marca de una falla esperada; los errores que salen de "use cache" no conservan su clase. */
const EXTRACTION_FAILED = "extraction-failed";

/** Misma consulta escrita distinto (mayúsculas, espacios) usa la misma entrada de caché. */
function cacheKey(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Llama al modelo y guarda la respuesta por consulta normalizada. La caché no
 * guarda datos de nadie: la clave es solo el texto. Las fallas se lanzan como
 * error para que no queden en caché.
 */
async function extractCached(text: string): Promise<ExtractedCriteria> {
  "use cache";
  cacheLife("hours");
  const config = geminiConfig();
  const criteria = config ? await createGeminiExtractor(config).extract(text) : null;
  if (!criteria) throw new Error(EXTRACTION_FAILED);
  return criteria;
}

async function tryExtract(text: string): Promise<ExtractedCriteria | null> {
  try {
    return await extractCached(cacheKey(text));
  } catch (error) {
    const expected = error instanceof Error && error.message === EXTRACTION_FAILED;
    if (!expected) console.error("aiFallback", error);
    return null;
  }
}

/**
 * Respaldo con IA para el asistente: exige sesión y reserva la cuota diaria
 * antes de llamar al modelo. Sin `GEMINI_API_KEY` queda apagado.
 */
export function createAiFallback(locale: string): AiFallback | undefined {
  const config = geminiConfig();
  if (!config) return undefined;

  return async (text: string): Promise<AiOutcome> => {
    const user = await getUserDb();
    if (!user) return { status: "signIn" };
    const reservation = await reserveAiUse(user, { query: text, locale, model: config.model });
    if (reservation === "limit") return { status: "limit" };
    if (reservation === "error") return { status: "unavailable" };

    const criteria = await tryExtract(text);
    return criteria ? { status: "ok", criteria } : { status: "unavailable" };
  };
}
