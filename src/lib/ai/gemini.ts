import "server-only";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
/** Si el modelo tarda más, se sigue sin él. */
const TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 2048;

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface GeminiOptions {
  apiKey: string;
  model: string;
  fetchImpl?: FetchLike;
}

export interface JsonPrompt {
  /** Instrucciones fijas. */
  system: string;
  /** Datos del pedido, siempre como JSON para que no se mezclen con las instrucciones. */
  user: string;
}

export interface GeminiClient {
  readonly model: string;
  /** JSON que devolvió el modelo, sin validar; null ante cualquier falla. */
  generateJson(prompt: JsonPrompt, responseSchema: object): Promise<unknown>;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

function readJson(text: string | undefined): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Cliente mínimo de la API REST de Gemini con salida JSON estructurada. */
export function createGeminiClient({ apiKey, model, fetchImpl = fetch }: GeminiOptions): GeminiClient {
  async function generateJson(prompt: JsonPrompt, responseSchema: object): Promise<unknown> {
    try {
      const response = await fetchImpl(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: prompt.system }] },
          contents: [{ role: "user", parts: [{ text: prompt.user }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: responseSchema,
            temperature: 0,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) {
        console.error("gemini", response.status);
        return null;
      }
      const data = (await response.json()) as GeminiResponse;
      return readJson(data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (error) {
      console.error("gemini", error instanceof Error ? error.name : "unknown");
      return null;
    }
  }

  return { model, generateJson };
}
