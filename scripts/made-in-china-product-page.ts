/**
 * Extrae los datos de una ficha de producto de Made-in-China.com a partir del
 * HTML ya descargado. Funciones puras: no tocan la red ni la base.
 *
 * Fuentes, de más a menos confiable: los bloques JSON-LD (nombre, descripción,
 * especificaciones, rubro) y el marcado de la tabla de precios.
 */
import { displayableImages } from "../src/lib/catalog/images";

import { parseGalleryImages } from "./made-in-china-images";
import { decodeHtmlEntities, normalizeText, parseMinOrder } from "./made-in-china-parser";

export interface PriceTier {
  readonly minQty: number;
  readonly unitPrice: number;
}

export interface PriceInfo {
  readonly tiers: readonly PriceTier[];
  readonly minOrderQty: number;
  readonly unit: string;
  readonly lowestPrice: number;
}

export interface ScrapedSpec {
  readonly label: string;
  readonly value: string;
}

export interface ScrapedProductPage {
  readonly externalId: string;
  readonly name: string;
  readonly description: string;
  readonly categoryPath: readonly string[];
  readonly imageUrls: readonly string[];
  readonly specs: readonly ScrapedSpec[];
  readonly price: PriceInfo | null;
  /** Por qué no hay precio utilizable, para el reporte de omitidos. */
  readonly priceIssue: string | null;
  readonly leadTimeDays: number | null;
  readonly sourceUrl: string;
}

const MAX_SPECS = 10;
const MAX_SPEC_VALUE_LENGTH = 120;
const PRODUCT_ID = /\/product\/([A-Za-z0-9]{12})\//;

/** Especificaciones que repiten casi todas las fichas o que ya guardamos en otro lado. */
const SKIPPED_SPECS: ReadonlySet<string> = new Set([
  "model no.",
  "after-sales service",
  "warranty",
  "trademark",
  "origin",
  "hs code",
  "transport package",
  "specification",
  "production capacity",
  "customization",
  "certification",
]);

const TIER_MARKUP =
  /<(?:span|div)[^>]*class="swiper-money-container"[^>]*>\s*US\$\s*([\d,]+(?:\.\d+)?)\s*<\/(?:span|div)>\s*<div[^>]*class="swiper-unit-container"[^>]*>\s*([\d,]+)[^<]*<span[^>]*class="unit"[^>]*>\s*([^<]+?)\s*<\/span>/gi;

const RANGE_MARKUP =
  /only-one-priceNum-td-left"[^>]*>\s*US\$\s*([\d,]+(?:\.\d+)?)(?:\s*-\s*([\d,]+(?:\.\d+)?))?\s*<\/span>\s*<span[^>]*only-one-priceNum-price"[^>]*>\s*([^<]*?)\s*\(MOQ\)/i;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonLdBlocks(html: string): JsonObject[] {
  const blocks: JsonObject[] = [];
  for (const match of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data: unknown = JSON.parse(match[1]);
      blocks.push(...(Array.isArray(data) ? data : [data]).filter(isObject));
    } catch {
      // Un bloque estructurado roto no debe impedir leer el resto de la ficha.
    }
  }
  return blocks;
}

function asText(value: unknown): string {
  return typeof value === "string" ? normalizeText(value) : "";
}

function toNumber(text: string): number {
  return Number(text.replace(/,/g, ""));
}

function readSpecs(product: JsonObject): ScrapedSpec[] {
  const properties = Array.isArray(product.additionalProperty) ? product.additionalProperty : [];
  const specs = properties
    .filter(isObject)
    .map((property) => ({ label: asText(property.name), value: asText(property.value) }))
    .filter((spec) => spec.label !== "" && spec.value !== "")
    .filter((spec) => !SKIPPED_SPECS.has(spec.label.toLowerCase()))
    .filter((spec) => spec.value.length <= MAX_SPEC_VALUE_LENGTH);
  return specs.slice(0, MAX_SPECS);
}

function readCategoryPath(blocks: readonly JsonObject[]): string[] {
  const breadcrumb = blocks.find((block) => block["@type"] === "BreadcrumbList");
  const items = Array.isArray(breadcrumb?.itemListElement) ? breadcrumb.itemListElement : [];
  const names = items.filter(isObject).map((item) => asText(item.name));
  return names.slice(1, -1).filter((name) => name !== "");
}

function readImages(html: string, product: JsonObject): string[] {
  const gallery = parseGalleryImages(html);
  if (gallery.length > 0) return gallery;
  const declared = Array.isArray(product.image) ? product.image : [product.image];
  const urls = declared.filter((url): url is string => typeof url === "string");
  return displayableImages(urls.map((url) => (url.startsWith("//") ? `https:${url}` : url)));
}

export function plainText(html: string): string {
  return decodeHtmlEntities(
    html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function readLeadTime(html: string): number | null {
  const match = /Lead Time\s*:?\s*(\d{1,3})\s*days?/i.exec(plainText(html));
  return match ? Number(match[1]) : null;
}

type PriceResult = { price: PriceInfo; issue: null } | { price: null; issue: string };

function parseTiers(html: string): PriceResult | null {
  const rows = [...html.matchAll(TIER_MARKUP)];
  if (rows.length === 0) return null;
  const tiers = new Map<number, number>();
  let unit: string | null = null;
  for (const row of rows) {
    const minQty = toNumber(row[2]);
    try {
      unit ??= parseMinOrder(`${minQty} ${row[3]}`).unit;
    } catch {
      return { price: null, issue: `unidad no soportada: ${row[3]}` };
    }
    if (!tiers.has(minQty)) tiers.set(minQty, toNumber(row[1]));
  }
  const sorted = [...tiers.entries()].sort((a, b) => a[0] - b[0]).map(([minQty, unitPrice]) => ({ minQty, unitPrice }));
  return finishPrice(sorted, unit ?? "piece");
}

function parseRange(html: string): PriceResult | null {
  const match = RANGE_MARKUP.exec(html);
  if (!match) return null;
  let order: { qty: number; unit: string };
  try {
    order = parseMinOrder(match[3]);
  } catch {
    return { price: null, issue: `unidad no soportada: ${match[3]}` };
  }
  const low = toNumber(match[1]);
  const high = match[2] ? toNumber(match[2]) : low;
  const unitPrice = Math.max(low, high);
  const result = finishPrice([{ minQty: order.qty, unitPrice }], order.unit);
  return result.price ? { price: { ...result.price, lowestPrice: Math.min(low, high) }, issue: null } : result;
}

function finishPrice(tiers: readonly PriceTier[], unit: string): PriceResult {
  if (tiers.some((tier) => !(tier.unitPrice > 0) || !(tier.minQty > 0))) {
    return { price: null, issue: "precio o cantidad inválidos" };
  }
  const lowestPrice = Math.min(...tiers.map((tier) => tier.unitPrice));
  return { price: { tiers, minOrderQty: tiers[0].minQty, unit, lowestPrice }, issue: null };
}

function readPrice(html: string): PriceResult {
  return parseTiers(html) ?? parseRange(html) ?? { price: null, issue: "sin precio numérico en la ficha" };
}

/** Devuelve null si la página no es una ficha de producto reconocible. */
export function parseProductPage(html: string, url: string): ScrapedProductPage | null {
  const idMatch = PRODUCT_ID.exec(url);
  const blocks = jsonLdBlocks(html);
  const product = blocks.find((block) => block["@type"] === "Product");
  if (!idMatch || !product) return null;
  const name = asText(product.name);
  if (name === "") return null;
  const { price, issue } = readPrice(html);
  return {
    externalId: idMatch[1],
    name,
    description: asText(product.description),
    categoryPath: readCategoryPath(blocks),
    imageUrls: readImages(html, product),
    specs: readSpecs(product),
    price,
    priceIssue: issue,
    leadTimeDays: readLeadTime(html),
    sourceUrl: url,
  };
}

const HOME_LINK = /(?:https?:)?\/\/([a-z0-9.-]+)\/product\/([A-Za-z0-9]{12})\/([^"'?#\s<>]+\.html)/gi;

/** Fichas del propio proveedor que muestra su portada, en el orden en que las muestra. */
export function extractHomeProductUrls(html: string, host: string, limit: number): string[] {
  const urls = new Map<string, string>();
  for (const match of html.matchAll(HOME_LINK)) {
    if (match[1].toLowerCase() !== host.toLowerCase() || urls.has(match[2])) continue;
    urls.set(match[2], `https://${host}/product/${match[2]}/${match[3]}`);
    if (urls.size >= limit) break;
  }
  return [...urls.values()];
}
