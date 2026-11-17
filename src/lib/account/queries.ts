import { z } from "zod";

import type { UserDb } from "@/lib/supabase/user-client";

const profileSchema = z.object({
  full_name: z.string().nullable(),
  company: z.string().nullable(),
  country_code: z.string().nullable(),
});

const productRef = z.object({
  id: z.uuid(),
  name_en: z.string(),
  name_es: z.string(),
  unit: z.string(),
  supplier: z.object({ name: z.string(), slug: z.string() }),
});

const favoriteSchema = z.object({ id: z.uuid(), product: productRef });

const rfqSchema = z.object({
  id: z.uuid(),
  message: z.string(),
  destination: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  supplier: z.object({ name: z.string() }),
  items: z.array(
    z.object({
      quantity: z.coerce.number(),
      product: productRef.pick({ id: true, name_en: true, name_es: true, unit: true }),
    }),
  ),
});

export type Profile = z.infer<typeof profileSchema>;
export type FavoriteItem = z.infer<typeof favoriteSchema>;
export type RfqSummary = z.infer<typeof rfqSchema>;

const PRODUCT_FIELDS = "id, name_en, name_es, unit";

function fail(action: string, error: { message: string }): never {
  throw new Error(`No se pudo ${action}: ${error.message}`);
}

export async function getProfile({ db, userId }: UserDb): Promise<Profile | null> {
  const { data, error } = await db
    .from("profiles")
    .select("full_name, company, country_code")
    .eq("id", userId)
    .maybeSingle();
  if (error) fail("cargar el perfil", error);
  return data ? profileSchema.parse(data) : null;
}

export async function isFavorite({ db }: UserDb, productId: string): Promise<boolean> {
  const { data, error } = await db
    .from("favorites")
    .select("id")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) fail("consultar favoritos", error);
  return data !== null;
}

export async function listFavorites({ db }: UserDb): Promise<FavoriteItem[]> {
  const { data, error } = await db
    .from("favorites")
    .select(`id, product:products!inner(${PRODUCT_FIELDS}, supplier:suppliers(name, slug))`)
    .not("product_id", "is", null)
    .order("created_at", { ascending: false });
  if (error) fail("cargar favoritos", error);
  return z.array(favoriteSchema).parse(data);
}

export async function listRfqs({ db }: UserDb): Promise<RfqSummary[]> {
  const { data, error } = await db
    .from("rfqs")
    .select(
      `id, message, destination, status, created_at, supplier:suppliers(name),
       items:rfq_items(quantity, product:products(${PRODUCT_FIELDS}))`,
    )
    .order("created_at", { ascending: false });
  if (error) fail("cargar cotizaciones", error);
  return z.array(rfqSchema).parse(data);
}
