import "server-only";

import { createGeminiClient, type GeminiOptions } from "@/lib/ai/gemini";

import {
  buildExtractionPrompt,
  EXTRACTION_RESPONSE_SCHEMA,
  parseExtraction,
  type CriteriaExtractor,
} from "./extract";

/** Extractor de criterios con Gemini. Ante cualquier falla devuelve null y el asistente sigue sin IA. */
export function createGeminiExtractor(options: GeminiOptions): CriteriaExtractor {
  const client = createGeminiClient(options);
  return {
    model: client.model,
    extract: async (text) =>
      parseExtraction(
        await client.generateJson(buildExtractionPrompt(text), EXTRACTION_RESPONSE_SCHEMA),
      ),
  };
}
