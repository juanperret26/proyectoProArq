/**
 * Lee la portada y las fichas de los productos principales de cada proveedor
 * del JSON de Made-in-China.com y las guarda en una caché en disco.
 * Uso: npm run scrape:made-in-china-suppliers -- <proveedores.json> <carpeta-cache> [--max=25] [--limit=N]
 *
 * No toca la base. Una petición cada 2 s, con un User-Agent que identifica a
 * ProArq, solo URLs https del propio sitio y sin query (el robots.txt bloquea
 * las que llevan "html?"). Si el sitio responde 403 o 429 se corta de inmediato.
 * Es reanudable: los proveedores que ya están en la caché se saltean.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { assertProductPageUrl } from "./made-in-china-images";
import { hasCache, writeCache, type CachedProduct } from "./made-in-china-cache";
import {
  extractHomeProductUrls,
  parseProductPage,
  plainText,
} from "./made-in-china-product-page";
import { mapBusinessType, parseSuppliersJson, type RawSupplier } from "./made-in-china-suppliers";

const USER_AGENT = "ProArqResearchBot/0.1 (prueba de catalogo; una peticion por pagina)";
const SITE_DOMAIN = "made-in-china.com";
const PAUSE_MS = 2000;
const RETRY_PAUSE_MS = 5000;
const TIMEOUT_MS = 30_000;
const DEFAULT_MAX_PRODUCTS = 25;
const PROFILE_TEXT_LIMIT = 6000;

class BlockedError extends Error {}

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}

function log(message: string): void {
  process.stderr.write(`${message}\n`);
}

function assertSiteHost(url: URL): void {
  const host = url.hostname;
  if (url.protocol !== "https:" || (host !== SITE_DOMAIN && !host.endsWith(`.${SITE_DOMAIN}`))) {
    throw new Error(`Solo se leen páginas https de ${SITE_DOMAIN}: ${url.toString()}`);
  }
}

async function politeFetch(url: string): Promise<string> {
  assertSiteHost(new URL(url));
  for (let attempt = 1; ; attempt++) {
    const wait = lastRequestAt + PAUSE_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.status === 403 || response.status === 429) {
        throw new BlockedError(`HTTP ${response.status} en ${url}: el sitio pide frenar`);
      }
      if (!response.ok) throw new Error(`HTTP ${response.status} en ${url}`);
      assertSiteHost(new URL(response.url));
      return await response.text();
    } catch (error: unknown) {
      if (error instanceof BlockedError || attempt >= 2) throw error;
      await sleep(RETRY_PAUSE_MS);
    }
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function scrapeProduct(url: string): Promise<CachedProduct> {
  try {
    const page = parseProductPage(await politeFetch(assertProductPageUrl(url)), url);
    return { url, page, error: page ? null : "la página no es una ficha de producto" };
  } catch (error: unknown) {
    if (error instanceof BlockedError) throw error;
    return { url, page: null, error: describeError(error) };
  }
}

async function productUrls(host: string, homeHtml: string, max: number): Promise<string[]> {
  const urls = extractHomeProductUrls(homeHtml, host, max);
  if (urls.length >= max) return urls;
  const listing = await politeFetch(`https://${host}/product-list-1.html`);
  const merged = [...new Set([...urls, ...extractHomeProductUrls(listing, host, max)])];
  return merged.slice(0, max);
}

async function profileTextOf(raw: RawSupplier, host: string, homeHtml: string): Promise<string | null> {
  if (mapBusinessType(raw.businessType)) return null;
  const link = new RegExp(`href="((?:https?:)?//${host.replace(/\./g, "\\.")}/company-[^"?#]+\\.html)"`, "i").exec(homeHtml);
  if (!link) return null;
  const url = link[1].startsWith("//") ? `https:${link[1]}` : link[1];
  try {
    return plainText(await politeFetch(url)).slice(0, PROFILE_TEXT_LIMIT);
  } catch (error: unknown) {
    if (error instanceof BlockedError) throw error;
    return null;
  }
}

async function scrapeSupplier(raw: RawSupplier, max: number, cacheDir: string): Promise<string> {
  const host = new URL(raw.profileUrl).hostname;
  const homeHtml = await politeFetch(`https://${host}/`);
  const urls = await productUrls(host, homeHtml, max);
  const profileText = await profileTextOf(raw, host, homeHtml);
  const products: CachedProduct[] = [];
  for (const url of urls) products.push(await scrapeProduct(url));
  writeCache(cacheDir, { supplierId: raw.supplierId, fetchedAt: new Date().toISOString(), profileText, products });
  const priced = products.filter((product) => product.page?.price).length;
  return `${products.length} fichas (${priced} con precio)`;
}

function option(name: string, fallback: number): number {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  const parsed = arg ? Number(arg.split("=")[1]) : fallback;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function main(): Promise<void> {
  const [jsonPath, cacheArg] = process.argv.slice(2).filter((value) => !value.startsWith("--"));
  if (!jsonPath || !cacheArg) throw new Error("Uso: <proveedores.json> <carpeta-cache> [--max=25] [--limit=N]");
  const cacheDir = resolve(cacheArg);
  const suppliers = parseSuppliersJson(readFileSync(jsonPath, "utf8")).slice(0, option("limit", Infinity));
  const max = option("max", DEFAULT_MAX_PRODUCTS);
  for (const [index, raw] of suppliers.entries()) {
    const label = `[${index + 1}/${suppliers.length}] ${raw.supplierId}`;
    if (hasCache(cacheDir, raw.supplierId)) {
      log(`${label}: ya en caché`);
      continue;
    }
    try {
      log(`${label}: ${await scrapeSupplier(raw, max, cacheDir)}`);
    } catch (error: unknown) {
      if (error instanceof BlockedError) throw error;
      log(`${label}: omitido (${describeError(error)})`);
    }
  }
  log("Listo.");
}

main().catch((error: unknown) => {
  log(describeError(error));
  process.exit(1);
});
