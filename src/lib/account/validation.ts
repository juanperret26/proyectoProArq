import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const MESSAGE_MAX_LENGTH = 4000;

/** Códigos de error que la interfaz traduce; el servidor nunca manda texto. */
export type FieldErrorCode =
  | "emailInvalid"
  | "passwordShort"
  | "nameTooLong"
  | "companyTooLong"
  | "countryInvalid"
  | "messageRequired"
  | "messageTooLong"
  | "destinationTooLong"
  | "quantityInvalid"
  | "quantityBelowMin"
  | "rateLimited"
  | "invalid";

const text = (value: FormDataEntryValue | null): string =>
  typeof value === "string" ? value.trim() : "";

export const loginSchema = z.object({
  email: z.email("emailInvalid"),
  password: z.string().min(1, "passwordShort"),
});

export const signupSchema = z.object({
  email: z.email("emailInvalid"),
  password: z.string().min(PASSWORD_MIN_LENGTH, "passwordShort"),
  fullName: z.string().max(120, "nameTooLong"),
});

export const profileSchema = z.object({
  fullName: z.string().max(120, "nameTooLong"),
  company: z.string().max(160, "companyTooLong"),
  countryCode: z.union([z.literal(""), z.string().regex(/^[A-Z]{2}$/, "countryInvalid")]),
});

export const rfqSchema = z.object({
  productId: z.uuid("invalid"),
  quantity: z.coerce
    .number("quantityInvalid")
    .positive("quantityInvalid")
    .max(1_000_000_000, "quantityInvalid"),
  message: z.string().min(1, "messageRequired").max(MESSAGE_MAX_LENGTH, "messageTooLong"),
  destination: z.string().max(160, "destinationTooLong"),
});

export type FormErrors = Partial<Record<string, FieldErrorCode>>;

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FormErrors };

/** Valida un formulario y devuelve, por campo, el primer código de error. */
export function parseForm<T>(
  schema: z.ZodType<T>,
  formData: FormData,
  fields: readonly string[],
): ParseResult<T> {
  const raw = Object.fromEntries(fields.map((field) => [field, text(formData.get(field))]));
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message as FieldErrorCode;
  }
  return { ok: false, errors };
}

/** Códigos SQL que create_rfq usa: cantidad bajo el pedido mínimo y tope de pedidos por hora. */
export const MIN_ORDER_ERROR = "22023";
export const RATE_LIMIT_ERROR = "PT429";

/** Traduce el código de error de create_rfq a los errores que ve la persona. */
export function rfqErrors(code: string | undefined): FormErrors {
  if (code === MIN_ORDER_ERROR) return { quantity: "quantityBelowMin" };
  if (code === RATE_LIMIT_ERROR) return { form: "rateLimited" };
  return { form: "invalid" };
}

/**
 * Ruta interna a la que volver tras ingresar. Solo acepta rutas propias
 * ("/account"): rechaza URLs absolutas y "//host" para evitar redirecciones abiertas.
 */
export function safeNextPath(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
