"use server";

import { revalidatePath } from "next/cache";
import { hasLocale } from "next-intl";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getUserDb } from "@/lib/supabase/user-client";

import { parseForm, profileSchema, rfqSchema, type FormErrors } from "./validation";

export type FormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; errors: FormErrors };

/** Código SQL que create_rfq usa cuando la cantidad no llega al pedido mínimo. */
const MIN_ORDER_ERROR = "22023";
const IDLE: FormState = { status: "idle" };
const GENERIC_ERROR: FormState = { status: "error", errors: { form: "invalid" } };

function localeOf(formData: FormData) {
  const value = formData.get("locale");
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUserDb();
  if (!user) return GENERIC_ERROR;
  const parsed = parseForm(profileSchema, formData, ["fullName", "company", "countryCode"]);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const { fullName, company, countryCode } = parsed.data;
  const values = {
    full_name: fullName || null,
    company: company || null,
    country_code: countryCode || null,
  };
  // Primero actualiza; si no había perfil, lo crea (un upsert tocaría la columna id).
  const updated = await user.db
    .from("profiles")
    .update(values)
    .eq("id", user.userId)
    .select("id");
  let error: { message: string } | null = updated.error;
  if (!error && (updated.data?.length ?? 0) === 0) {
    error = (await user.db.from("profiles").insert({ id: user.userId, ...values })).error;
  }
  if (error) {
    console.error("saveProfile", error.message);
    return GENERIC_ERROR;
  }
  revalidatePath("/[locale]/account", "page");
  return { status: "saved" };
}

/** Agrega el producto a favoritos o lo quita si ya estaba. */
export async function toggleFavorite(formData: FormData): Promise<void> {
  const user = await getUserDb();
  const productId = formData.get("productId");
  if (!user || typeof productId !== "string") return;
  const parsed = rfqSchema.shape.productId.safeParse(productId);
  if (!parsed.success) return;

  const existing = await user.db
    .from("favorites")
    .select("id")
    .eq("product_id", parsed.data)
    .maybeSingle();
  if (existing.error) return console.error("toggleFavorite", existing.error.message);

  const write = existing.data
    ? user.db.from("favorites").delete().eq("id", existing.data.id)
    : user.db.from("favorites").insert({ product_id: parsed.data });
  const { error } = await write;
  if (error) console.error("toggleFavorite", error.message);
  revalidatePath("/[locale]/products/[id]", "page");
  revalidatePath("/[locale]/account/favorites", "page");
}

export async function createRfq(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUserDb();
  if (!user) return GENERIC_ERROR;
  const parsed = parseForm(rfqSchema, formData, [
    "productId",
    "quantity",
    "message",
    "destination",
  ]);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };
  const { productId, quantity, message, destination } = parsed.data;

  // La función de la base crea la cotización y su item en una sola transacción,
  // deriva el proveedor del producto y exige el pedido mínimo.
  const { error } = await user.db.rpc("create_rfq", {
    p_product_id: productId,
    p_quantity: quantity,
    p_message: message,
    p_destination: destination,
  });
  if (error) {
    console.error("createRfq", error.code, error.message);
    return error.code === MIN_ORDER_ERROR
      ? { status: "error", errors: { quantity: "quantityBelowMin" } }
      : GENERIC_ERROR;
  }

  revalidatePath("/[locale]/account/rfqs", "page");
  redirect({ href: "/account/rfqs", locale: localeOf(formData) });
  return IDLE;
}
