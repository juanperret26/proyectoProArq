/**
 * Convierte las fichas guardadas en la caché del scraping en productos listos
 * para la BD, y explica cada ficha que se omite. Funciones puras.
 */
import type { SupplierCache } from "./made-in-china-cache";
import { classifyProduct } from "./made-in-china-classify";
import {
  DEFAULT_LEAD_TIME_DAYS,
  specLabelEs,
  type MicProduct,
  type MicSupplier,
} from "./made-in-china-parser";
import type { ScrapedProductPage } from "./made-in-china-product-page";

const MAX_DESCRIPTION_LENGTH = 1500;

export type OmitReason = "sin ficha" | "sin precio" | "fuera de rubro" | "repetido";

export interface Omission {
  readonly reason: OmitReason;
  readonly detail: string;
  readonly supplierId: string;
  readonly name: string;
}

export interface SupplierEntry {
  readonly supplier: MicSupplier;
  readonly cache: SupplierCache | null;
}

export interface BuiltProducts {
  readonly products: readonly MicProduct[];
  readonly omitted: readonly Omission[];
}

function describeProduct(page: ScrapedProductPage, supplier: MicSupplier): string {
  if (page.description === "") return `${page.name} from ${supplier.name} (${supplier.city}).`;
  return page.description.slice(0, MAX_DESCRIPTION_LENGTH).trim();
}

function toProduct(
  page: ScrapedProductPage,
  categorySlug: string,
  supplier: MicSupplier,
  fetchedAt: string,
  nameEs: Readonly<Record<string, string>>,
): MicProduct | null {
  if (!page.price) return null;
  return {
    externalId: page.externalId,
    supplierExternalId: supplier.externalId,
    categorySlug,
    nameEn: page.name,
    nameEs: nameEs[page.externalId] ?? null,
    descriptionEn: describeProduct(page, supplier),
    descriptionEs: null,
    specs: page.specs.map((spec) => ({ label_en: spec.label, label_es: specLabelEs(spec.label), value: spec.value })),
    unit: page.price.unit,
    minOrder: page.price.minOrderQty,
    leadTimeDays: page.leadTimeDays ?? DEFAULT_LEAD_TIME_DAYS,
    priceFrom: page.price.lowestPrice,
    tiers: page.price.tiers,
    imageUrls: page.imageUrls,
    sourceUrl: page.sourceUrl,
    scrapedAt: fetchedAt,
  };
}

export function buildProducts(
  entries: readonly SupplierEntry[],
  nameEs: Readonly<Record<string, string>>,
): BuiltProducts {
  const products: MicProduct[] = [];
  const omitted: Omission[] = [];
  const seen = new Set<string>();
  for (const { supplier, cache } of entries) {
    for (const cached of cache?.products ?? []) {
      const page = cached.page;
      const omit = (reason: OmitReason, detail: string): void => {
        omitted.push({ reason, detail, supplierId: supplier.externalId, name: page?.name ?? cached.url });
      };
      if (!page) {
        omit("sin ficha", cached.error ?? "");
        continue;
      }
      if (!page.price) {
        omit("sin precio", page.priceIssue ?? "");
        continue;
      }
      const categorySlug = classifyProduct({ name: page.name, categoryPath: page.categoryPath });
      if (!categorySlug) {
        omit("fuera de rubro", page.categoryPath.join(" > "));
        continue;
      }
      if (seen.has(page.externalId)) {
        omit("repetido", page.externalId);
        continue;
      }
      const product = toProduct(page, categorySlug, supplier, cache?.fetchedAt ?? supplier.scrapedAt, nameEs);
      if (product) {
        seen.add(page.externalId);
        products.push(product);
      }
    }
  }
  return { products, omitted };
}
