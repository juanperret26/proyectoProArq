/**
 * Convierte el CSV de empresas de Taiwán y Turquía (directorios Kompass y Dalil)
 * y sus líneas de producto en proveedores y productos para la BD de ProArq.
 * Funciones puras. Los productos no tienen precio, pedido mínimo, plazo ni fotos.
 */
import { DIRECTORY_COMPANIES, type DirectoryCompany } from "./directory-companies-data";
import {
  parseCsv,
  slugify,
  type MicData,
  type MicProduct,
  type MicSupplier,
} from "./made-in-china-parser";

export const RESEARCHED_AT = "2026-11-21T00:00:00Z";
const DEFAULT_UNIT = "unit";

interface Origin {
  readonly code: string;
  readonly countryEn: string;
  readonly countryEs: string;
  readonly sourceSite: string;
  readonly sourceName: string;
}

const ORIGINS: Readonly<Record<string, Origin>> = {
  Taiwan: { code: "TW", countryEn: "Taiwan", countryEs: "Taiwán", sourceSite: "kompass", sourceName: "Kompass" },
  Turquia: { code: "TR", countryEn: "Turkey", countryEs: "Turquía", sourceSite: "dalil", sourceName: "Dalil" },
};

export interface DirectoryGroup {
  readonly sourceSite: string;
  readonly data: MicData;
}

function originOf(country: string, company: string): Origin {
  const origin = ORIGINS[country.trim()];
  if (!origin) throw new Error(`País no soportado "${country}" en ${company}.`);
  return origin;
}

function buildSupplier(company: DirectoryCompany, city: string, origin: Origin): MicSupplier {
  const slug = slugify(company.csvName);
  return {
    slug,
    name: company.csvName,
    countryCode: origin.code,
    city,
    foundedYear: null,
    businessType: "trading_company",
    certifications: [],
    descriptionEn: `${company.csvName} is a company based in ${city}, ${origin.countryEn}. Listed activity: ${company.activityEn}. Company listing from ${origin.sourceName}.`,
    descriptionEs: `${company.csvName} es una empresa con sede en ${city}, ${origin.countryEs}. Actividad informada: ${company.activityEs}. Ficha de empresa tomada de ${origin.sourceName}.`,
    sourceUrl: company.website,
    externalId: slug,
    scrapedAt: RESEARCHED_AT,
  };
}

function buildProducts(
  company: DirectoryCompany,
  supplier: MicSupplier,
  origin: Origin,
): MicProduct[] {
  return company.products.map((product) => {
    const enTail = company.fromSite
      ? "Product line listed on the company's official website."
      : `Activity listed for this company in the ${origin.sourceName} business directory. Prices and order details are not published.`;
    const esTail = company.fromSite
      ? "Línea de producto publicada en el sitio oficial de la empresa."
      : `Actividad informada para esta empresa en el directorio ${origin.sourceName}. No publica precios ni condiciones de pedido.`;
    return {
      externalId: `${supplier.slug}-${slugify(product.nameEn)}`,
      supplierExternalId: supplier.externalId,
      categorySlug: product.category,
      nameEn: product.nameEn,
      nameEs: product.nameEs,
      descriptionEn: `${product.nameEn} from ${supplier.name} (${supplier.city}). ${enTail}`,
      descriptionEs: `${product.nameEs} de ${supplier.name} (${supplier.city}). ${esTail}`,
      specs: [],
      unit: DEFAULT_UNIT,
      minOrder: null,
      leadTimeDays: null,
      priceFrom: null,
      tiers: [],
      imageUrls: [],
      sourceUrl: product.pageUrl ?? company.website,
      scrapedAt: RESEARCHED_AT,
    };
  });
}

/** Un grupo por directorio de origen, porque cada uno se guarda con su propio `source_site`. */
export function buildDirectoryGroups(
  csvText: string,
  companies: readonly DirectoryCompany[] = DIRECTORY_COMPANIES,
): DirectoryGroup[] {
  const bySite = new Map<string, { suppliers: MicSupplier[]; products: MicProduct[] }>();
  const slugs = new Set<string>();
  const productIds = new Set<string>();
  const used = new Set<string>();

  for (const row of parseCsv(csvText)) {
    const name = row.empresa?.trim();
    const company = companies.find((entry) => entry.csvName === name);
    if (!name || !company) throw new Error(`La empresa "${name}" del CSV no tiene datos de producto.`);
    const origin = originOf(row.pais ?? "", name);
    const city = company.cityEn ?? row.ciudad.trim();
    const supplier = buildSupplier(company, city, origin);
    if (slugs.has(supplier.slug)) throw new Error(`El slug "${supplier.slug}" se repite.`);
    slugs.add(supplier.slug);
    used.add(name);

    const products = buildProducts(company, supplier, origin);
    for (const product of products) {
      if (productIds.has(product.externalId)) throw new Error(`Producto repetido: ${product.externalId}.`);
      productIds.add(product.externalId);
    }
    const group = bySite.get(origin.sourceSite) ?? { suppliers: [], products: [] };
    group.suppliers.push(supplier);
    group.products.push(...products);
    bySite.set(origin.sourceSite, group);
  }

  const unused = companies.filter((entry) => !used.has(entry.csvName)).map((entry) => entry.csvName);
  if (unused.length > 0) throw new Error(`Empresas con datos pero ausentes del CSV: ${unused.join(", ")}.`);
  return [...bySite.entries()].map(([sourceSite, data]) => ({ sourceSite, data }));
}
