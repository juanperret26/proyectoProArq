import { z } from "zod";

import { createPublicClient } from "@/lib/supabase/public-client";

import { lookupCategory } from "./category-lookup";
import { toSearchRpcArgs, type SearchFilters } from "./filters";
import {
  certificationOptionSchema,
  countrySchema,
  productDetailSchema,
  productSummarySchema,
  searchRowSchema,
  supplierDetailSchema,
  supplierProductRowSchema,
  type Certification,
  type Country,
  type ProductDetail,
  type ProductSummary,
  type SupplierDetail,
} from "./schemas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const PRODUCT_DETAIL_SELECT = `
  id, name_en, name_es, description_en, description_es, specs, unit,
  min_order_qty, lead_time_days, price_from_usd,
  category:categories (slug, name_en, name_es),
  supplier:suppliers (
    id, slug, name, country_code, city, founded_year, business_type,
    is_verified, response_time_hours, description_en, description_es,
    certs:supplier_certifications (certification:certifications (code, name))
  ),
  price_tiers (min_qty, unit_price_usd)
`;

const SUPPLIER_DETAIL_SELECT = `
  id, slug, name, country_code, city, founded_year, business_type,
  is_verified, response_time_hours, description_en, description_es,
  certs:supplier_certifications (certification:certifications (code, name))
`;

export interface SearchResult {
  items: ProductSummary[];
  total: number;
}

function fail(action: string, error: { message: string }): never {
  throw new Error(`No se pudo ${action}: ${error.message}`);
}

/** Búsqueda con filtros. `category` fija el rubro cuando lo define la ruta. */
export async function searchProducts(
  filters: SearchFilters,
  category: string | null = filters.category,
): Promise<SearchResult> {
  const { data, error } = await createPublicClient().rpc(
    "search_products",
    toSearchRpcArgs(filters, category),
  );
  if (error) fail("buscar productos", error);
  const rows = z.array(searchRowSchema).parse(data);
  return {
    total: rows[0]?.total_count ?? 0,
    items: rows.map((row) => productSummarySchema.parse(row)),
  };
}

/** Muestra de productos de proveedores verificados, para el inicio. */
export async function getFeaturedProducts(limit: number): Promise<ProductSummary[]> {
  const { data, error } = await createPublicClient().rpc("search_products", {
    sort_by: "relevance",
    verified_only: true,
    page_size: limit,
  });
  if (error) fail("cargar productos destacados", error);
  return z
    .array(searchRowSchema)
    .parse(data)
    .map((row) => productSummarySchema.parse(row));
}

export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) fail("cargar el producto", error);
  if (!data) return null;
  const product = productDetailSchema.parse(data);
  return {
    ...product,
    price_tiers: [...product.price_tiers].sort((a, b) => a.min_qty - b.min_qty),
  };
}

/** Productos para el comparador, en el mismo orden que `ids`. */
export async function getProductsByIds(ids: readonly string[]): Promise<ProductDetail[]> {
  const valid = ids.filter((id) => UUID.test(id));
  if (valid.length === 0) return [];
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .in("id", valid);
  if (error) fail("cargar los productos a comparar", error);
  const byId = new Map(
    z
      .array(productDetailSchema)
      .parse(data)
      .map((product) => [product.id, product] as const),
  );
  return valid.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
}

export async function getSupplierDetail(slug: string): Promise<SupplierDetail | null> {
  if (!SLUG.test(slug)) return null;
  const { data, error } = await createPublicClient()
    .from("suppliers")
    .select(SUPPLIER_DETAIL_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail("cargar el proveedor", error);
  return data ? supplierDetailSchema.parse(data) : null;
}

export async function getSupplierProducts(
  supplierId: string,
): Promise<ProductSummary[]> {
  const { data, error } = await createPublicClient()
    .from("products")
    .select(
      `id, name_en, name_es, unit, min_order_qty, lead_time_days, price_from_usd,
       image_urls, supplier_id,
       category:categories (slug),
       supplier:suppliers (slug, name, country_code, is_verified)`,
    )
    .eq("supplier_id", supplierId)
    .order("name_en")
    .limit(60);
  if (error) fail("cargar los productos del proveedor", error);
  return z
    .array(supplierProductRowSchema)
    .parse(data)
    .map((row) =>
      productSummarySchema.parse({
        id: row.id,
        name_en: row.name_en,
        name_es: row.name_es,
        unit: row.unit,
        min_order_qty: row.min_order_qty,
        lead_time_days: row.lead_time_days,
        price_from_usd: row.price_from_usd,
        image_urls: row.image_urls,
        category_slug: row.category.slug,
        parent_category_slug: lookupCategory(row.category.slug)?.parent?.slug ?? null,
        supplier_id: row.supplier_id,
        supplier_slug: row.supplier.slug,
        supplier_name: row.supplier.name,
        country_code: row.supplier.country_code,
        is_verified: row.supplier.is_verified,
      }),
    );
}

export interface FilterOptions {
  countries: Country[];
  certifications: Certification[];
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const client = createPublicClient();
  const [countries, certifications] = await Promise.all([
    client.from("countries").select("code, name_en, name_es").order("name_en"),
    client.from("certifications").select("code, name").order("code"),
  ]);
  if (countries.error) fail("cargar los países", countries.error);
  if (certifications.error) fail("cargar las certificaciones", certifications.error);
  return {
    countries: z.array(countrySchema).parse(countries.data),
    certifications: z.array(certificationOptionSchema).parse(certifications.data),
  };
}
