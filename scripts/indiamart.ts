/**
 * Convierte el JSON del scraper de IndiaMART en proveedores y productos listos
 * para la BD de ProArq (mismos tipos que Made-in-China). Funciones puras.
 *
 * Cada fila del JSON es un producto con los datos de su proveedor. Los precios
 * vienen en rupias y se convierten a USD con un tipo de cambio fijo y
 * documentado en el SQL generado.
 */
import { z } from "zod";

import { classifyProduct } from "./made-in-china-classify";
import {
  DEFAULT_LEAD_TIME_DAYS,
  normalizeText,
  slugify,
  specLabelEs,
  UNIT_LABELS,
  type MicProduct,
  type MicSpec,
  type MicSupplier,
} from "./made-in-china-parser";

export const INDIAMART_SOURCE_SITE = "indiamart";
/** USD por rupia (aprox. 89 INR = 1 USD a noviembre de 2026). */
export const INR_TO_USD = 0.0112;

const COUNTRY_CODE = "IN";
const SQFT_PER_M2 = 10.7639;
const LAKH = 100_000;
const CRORE = 10_000_000;
const PRICE_DECIMALS = 4;

interface UnitRule {
  readonly code: string;
  /** Cuántas unidades del sitio entran en una unidad de ProArq. */
  readonly perCode: number;
}

const UNITS: Readonly<Record<string, UnitRule>> = {
  kg: { code: "kg", perCode: 1 },
  kilogram: { code: "kg", perCode: 1 },
  piece: { code: "piece", perCode: 1 },
  unit: { code: "unit", perCode: 1 },
  meter: { code: "m", perCode: 1 },
  "square meter": { code: "m2", perCode: 1 },
  "square feet": { code: "m2", perCode: SQFT_PER_M2 },
};

const rowSchema = z.object({
  productName: z.string().min(1),
  companyName: z.string().min(1),
  supplierCity: z.string().nullish(),
  supplierState: z.string().nullish(),
  price: z.string().nullish(),
  moq: z.string().nullish(),
  productUrl: z.string().min(1),
  supplierUrl: z.string().min(1),
  imageUrl: z.string().nullish(),
  businessType: z.string().nullish(),
  yearEstablished: z.string().nullish(),
  specifications: z.array(z.string()).nullish(),
  scrapedAt: z.string().min(1),
  supplierId: z.string().min(1),
  categoryName: z.string().nullish(),
  searchQuery: z.string().nullish(),
});

export type IndiaMartRow = z.infer<typeof rowSchema>;

export type OmitReason = "sin precio" | "unidad no reconocida" | "fuera de rubro" | "repetido";

export interface Omission {
  readonly reason: OmitReason;
  readonly externalId: string;
  readonly name: string;
}

export interface IndiaMartData {
  readonly suppliers: readonly MicSupplier[];
  readonly products: readonly MicProduct[];
  readonly omitted: readonly Omission[];
}

export interface IndiaMartOptions {
  /** Nombre en español por id de producto; sin entrada queda en null. */
  readonly nameEs: Readonly<Record<string, string>>;
}

export function parseIndiaMartRows(content: string): IndiaMartRow[] {
  const data: unknown = JSON.parse(content);
  if (!Array.isArray(data)) throw new Error("El archivo debe ser una lista de productos.");
  return data.map((entry, index) => {
    const result = rowSchema.safeParse(entry);
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new Error(`Fila #${index + 1}: ${issue.path.join(".")} ${issue.message}`);
    }
    return result.data;
  });
}

/** "₹ 23.10 Lakh/Piece" -> { inr: 2310000, unit: "Piece" }; null si no hay precio utilizable. */
export function parseInrPrice(raw: string | null | undefined): { inr: number; unit: string } | null {
  const match = /^₹\s*([\d,]+(?:\.\d+)?)\s*(Lakh|Crore)?\s*\/\s*(.+)$/i.exec((raw ?? "").trim());
  if (!match) return null;
  const scale = /^lakh$/i.test(match[2] ?? "") ? LAKH : /^crore$/i.test(match[2] ?? "") ? CRORE : 1;
  const inr = Number(match[1].replace(/,/g, "")) * scale;
  return inr > 0 ? { inr, unit: match[3].trim() } : null;
}

/** Casos donde las reglas generales de Made-in-China se equivocan con los títulos de IndiaMART. */
const CATEGORY_OVERRIDES: readonly { readonly test: RegExp; readonly slug: string }[] = [
  { test: /\bmixers?\b/i, slug: "concrete-machinery" },
  { test: /\b(road|bridge|pothole|compactor)\b/i, slug: "earthmoving-machinery" },
  { test: /\bsteel pipes?\b/i, slug: "steel-pipes" },
  { test: /\bsteel (plates?|sheets?)\b|\bplates?\b.*\bsheets\b/i, slug: "metal-coils-strips" },
];

function categoryFor(name: string, row: IndiaMartRow): string | null {
  return (
    CATEGORY_OVERRIDES.find((rule) => rule.test.test(name))?.slug ??
    classifyProduct({
      name,
      categoryPath: [(row.categoryName ?? "").replace(/-/g, " "), row.searchQuery ?? ""],
    })
  );
}

function round(value: number): number {
  return Number(value.toFixed(PRICE_DECIMALS));
}

function indiaMartUrl(raw: string, what: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${what} no es una URL válida: "${raw}".`);
  }
  if (url.protocol !== "https:" || url.hostname !== "www.indiamart.com") {
    throw new Error(`${what} debe ser una página https de www.indiamart.com: "${raw}".`);
  }
  return `${url.origin}${url.pathname}`;
}

function productId(url: string): string {
  const match = /\/proddetail\/(\d+)\.html$/.exec(url);
  if (!match) throw new Error(`No se encontró el id de producto en "${url}".`);
  return match[1];
}

/** Foto por https y en el tamaño grande que publica el sitio (500x500). */
function photoUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const url = new URL(raw);
    if (url.hostname !== "5.imimg.com") return [];
    return [`https://5.imimg.com${url.pathname.replace(/-250x250(\.\w+)$/, "-500x500$1")}`];
  } catch {
    return [];
  }
}

function parseMoq(raw: string | null | undefined): { qty: number; unit: string } | null {
  const match = /^(\d[\d,]*(?:\.\d+)?)\s+(.+)$/.exec((raw ?? "").trim());
  return match ? { qty: Number(match[1].replace(/,/g, "")), unit: match[2].trim() } : null;
}

function buildSpecs(lines: readonly string[] | null | undefined): MicSpec[] {
  return (lines ?? []).flatMap((line) => {
    const at = line.indexOf(":");
    if (at <= 0) return [];
    const label = normalizeText(line.slice(0, at));
    const value = normalizeText(line.slice(at + 1));
    return value ? [{ label_en: label, label_es: specLabelEs(label), value }] : [];
  });
}

function foundedYear(raw: string | null | undefined): number | null {
  const year = Number.parseInt(raw ?? "", 10);
  return year >= 1900 && year <= 2100 ? year : null;
}

function buildSupplier(row: IndiaMartRow): MicSupplier {
  const name = normalizeText(row.companyName);
  const city = normalizeText(row.supplierCity ?? "") || "India";
  const state = normalizeText(row.supplierState ?? "");
  const place = state && state !== city ? `${city}, ${state}` : city;
  const manufacturer = row.businessType === "Manufacturer";
  return {
    slug: slugify(name),
    name,
    countryCode: COUNTRY_CODE,
    city,
    foundedYear: foundedYear(row.yearEstablished),
    businessType: manufacturer ? "manufacturer" : "trading_company",
    certifications: [],
    descriptionEn: `${name} is ${manufacturer ? "a manufacturer" : "a trading company"} based in ${place}, India. Company profile from IndiaMART.`,
    descriptionEs: `${name} es ${manufacturer ? "un fabricante" : "una empresa comercializadora"} con sede en ${place}, India. Perfil de empresa tomado de IndiaMART.`,
    sourceUrl: indiaMartUrl(row.supplierUrl, "La página del proveedor"),
    externalId: row.supplierId,
    scrapedAt: row.scrapedAt,
  };
}

function describe(
  nameEn: string,
  nameEs: string | null,
  supplier: MicSupplier,
  specs: readonly MicSpec[],
  order: { qty: number; unit: string },
): { en: string; es: string | null } {
  const label = UNIT_LABELS[order.unit];
  const tail = (text: string): string => (text ? ` ${text}.` : "");
  const en = specs.map((s) => `${s.label_en}: ${s.value}`).join(". ");
  const es = specs.map((s) => `${s.label_es}: ${s.value}`).join(". ");
  return {
    en: `${nameEn} from ${supplier.name} (${supplier.city}).${tail(en)} Minimum order ${order.qty} ${label.en}.`,
    es: nameEs
      ? `${nameEs} de ${supplier.name} (${supplier.city}).${tail(es)} Pedido mínimo ${order.qty} ${label.es}.`
      : null,
  };
}

type ProductOutcome = { ok: true; product: MicProduct } | { ok: false; reason: OmitReason };

function buildProduct(row: IndiaMartRow, supplier: MicSupplier, options: IndiaMartOptions): ProductOutcome {
  const price = parseInrPrice(row.price);
  if (!price) return { ok: false, reason: "sin precio" };
  const moq = parseMoq(row.moq);
  const priceUnit = UNITS[price.unit.toLowerCase()];
  const moqUnit = moq ? UNITS[moq.unit.toLowerCase()] : undefined;
  if (!moq || !priceUnit || !moqUnit || priceUnit.code !== moqUnit.code) {
    return { ok: false, reason: "unidad no reconocida" };
  }
  const nameEn = normalizeText(row.productName);
  const categorySlug = categoryFor(nameEn, row);
  if (!categorySlug) return { ok: false, reason: "fuera de rubro" };

  const externalId = productId(indiaMartUrl(row.productUrl, "La página del producto"));
  const nameEs = options.nameEs[externalId] ?? null;
  const specs = buildSpecs(row.specifications);
  const order = { qty: round(moq.qty / moqUnit.perCode), unit: moqUnit.code };
  const unitPrice = round(price.inr * INR_TO_USD * priceUnit.perCode);
  const description = describe(nameEn, nameEs, supplier, specs, order);
  return {
    ok: true,
    product: {
      externalId,
      supplierExternalId: supplier.externalId,
      categorySlug,
      nameEn,
      nameEs,
      descriptionEn: description.en,
      descriptionEs: description.es,
      specs,
      unit: order.unit,
      minOrder: order.qty,
      leadTimeDays: DEFAULT_LEAD_TIME_DAYS,
      priceFrom: unitPrice,
      tiers: [{ minQty: order.qty, unitPrice }],
      imageUrls: photoUrls(row.imageUrl),
      sourceUrl: `https://www.indiamart.com/proddetail/${externalId}.html`,
      scrapedAt: row.scrapedAt,
    },
  };
}

export function buildIndiaMartData(rows: readonly IndiaMartRow[], options: IndiaMartOptions): IndiaMartData {
  const suppliers = new Map<string, MicSupplier>();
  const slugOwners = new Map<string, string>();
  const seen = new Set<string>();
  const products: MicProduct[] = [];
  const omitted: Omission[] = [];

  for (const row of rows) {
    let supplier = suppliers.get(row.supplierId);
    if (!supplier) {
      supplier = buildSupplier(row);
      const owner = slugOwners.get(supplier.slug);
      if (owner) throw new Error(`El slug "${supplier.slug}" se repite en ${owner} y ${row.supplierId}.`);
      slugOwners.set(supplier.slug, row.supplierId);
      suppliers.set(row.supplierId, supplier);
    }
    const outcome = buildProduct(row, supplier, options);
    const externalId = /\/proddetail\/(\d+)\.html$/.exec(row.productUrl)?.[1] ?? row.productUrl;
    if (!outcome.ok) {
      omitted.push({ reason: outcome.reason, externalId, name: row.productName });
    } else if (seen.has(outcome.product.externalId)) {
      omitted.push({ reason: "repetido", externalId, name: row.productName });
    } else {
      seen.add(outcome.product.externalId);
      products.push(outcome.product);
    }
  }
  return { suppliers: [...suppliers.values()], products, omitted };
}
