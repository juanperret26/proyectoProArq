import "server-only";

import type { UserDb } from "@/lib/supabase/user-client";

/**
 * Consultas con IA por persona en 24 horas (asistente y comparador juntos).
 * Solo se usa para mostrarlo: el límite real lo aplica `reserve_ai_use` en la base.
 */
export const DAILY_AI_LIMIT = 10;
/** Flash-Lite alcanza para estas tareas y su cuota gratuita es más amplia. */
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

export function geminiConfig(): { apiKey: string; model: string } | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return { apiKey, model: process.env.GEMINI_MODEL || DEFAULT_MODEL };
}

export type Reservation = "reserved" | "limit" | "error";

/** Cuenta y registra el uso en una sola transacción, antes de llamar al modelo. */
export async function reserveAiUse(
  user: UserDb,
  entry: { query: string; locale: string; model: string },
): Promise<Reservation> {
  const { data, error } = await user.db.rpc("reserve_ai_use", {
    p_query: entry.query,
    p_locale: entry.locale,
    p_model: entry.model,
  });
  if (error) {
    console.error("reserveAiUse", error.code, error.message);
    return "error";
  }
  return data === true ? "reserved" : "limit";
}
