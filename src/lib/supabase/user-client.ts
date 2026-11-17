import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "./config";

export type UserDb = { userId: string; db: SupabaseClient };

/**
 * Cliente de Supabase que actúa como la persona con sesión: cada pedido lleva
 * su token de Clerk y RLS decide qué filas puede ver o escribir.
 * Devuelve null si nadie inició sesión.
 */
export async function getUserDb(): Promise<UserDb | null> {
  const session = await auth();
  if (!session.userId) return null;
  const { url, key } = getSupabaseConfig();
  const db = createClient(url, key, {
    accessToken: async () => (await auth()).getToken(),
  });
  return { userId: session.userId, db };
}
