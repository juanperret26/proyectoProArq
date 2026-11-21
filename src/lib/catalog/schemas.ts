import { z } from "zod";

/** Esquemas de las respuestas de Supabase: se validan al entrar a la app. */

export const productSummarySchema = z.object({
  id: z.string(),
  name_en: z.string(),
  name_es: z.string().nullable(),
  unit: z.string(),
  min_order_qty: z.number().nullable(),
  lead_time_days: z.number().nullable(),
  price_from_usd: z.number().nullable(),
  image_urls: z.array(z.string()),
  category_slug: z.string(),
  parent_category_slug: z.string().nullable(),
  supplier_id: z.string(),
  supplier_slug: z.string(),
  supplier_name: z.string(),
  country_code: z.string(),
  is_verified: z.boolean(),
});

export const searchRowSchema = productSummarySchema.extend({
  total_count: z.number(),
});

const categoryRefSchema = z.object({
  slug: z.string(),
  name_en: z.string(),
  name_es: z.string(),
});

export const supplierSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  country_code: z.string(),
  city: z.string(),
  founded_year: z.number().nullable(),
  business_type: z.enum(["manufacturer", "trading_company"]),
  is_verified: z.boolean(),
  response_time_hours: z.number().nullable(),
  description_en: z.string(),
  description_es: z.string().nullable(),
});

const certificationSchema = z.object({
  code: z.string(),
  name: z.string(),
});

const supplierCertificationsSchema = z.array(
  z.object({ certification: certificationSchema }),
);

export const productDetailSchema = z.object({
  id: z.string(),
  name_en: z.string(),
  name_es: z.string().nullable(),
  description_en: z.string(),
  description_es: z.string().nullable(),
  specs: z.array(
    z.object({ label_en: z.string(), label_es: z.string(), value: z.string() }),
  ),
  unit: z.string(),
  min_order_qty: z.number().nullable(),
  lead_time_days: z.number().nullable(),
  price_from_usd: z.number().nullable(),
  image_urls: z.array(z.string()),
  category: categoryRefSchema,
  supplier: supplierSchema.extend({ certs: supplierCertificationsSchema }),
  price_tiers: z.array(
    z.object({ min_qty: z.number(), unit_price_usd: z.number() }),
  ),
});

export const supplierDetailSchema = supplierSchema.extend({
  certs: supplierCertificationsSchema,
  source_site: z.string(),
  source_url: z.string().nullable(),
});

/** Fila de `products` con su rubro y proveedor embebidos (ficha del proveedor). */
export const supplierProductRowSchema = z.object({
  id: z.string(),
  name_en: z.string(),
  name_es: z.string().nullable(),
  unit: z.string(),
  min_order_qty: z.number().nullable(),
  lead_time_days: z.number().nullable(),
  price_from_usd: z.number().nullable(),
  image_urls: z.array(z.string()),
  supplier_id: z.string(),
  category: z.object({ slug: z.string() }),
  supplier: z.object({
    slug: z.string(),
    name: z.string(),
    country_code: z.string(),
    is_verified: z.boolean(),
  }),
});

export const countrySchema = z.object({
  code: z.string(),
  name_en: z.string(),
  name_es: z.string(),
});

export const certificationOptionSchema = certificationSchema;

export type ProductSummary = z.infer<typeof productSummarySchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type SupplierDetail = z.infer<typeof supplierDetailSchema>;
export type Supplier = z.infer<typeof supplierSchema>;
export type Country = z.infer<typeof countrySchema>;
export type Certification = z.infer<typeof certificationSchema>;
