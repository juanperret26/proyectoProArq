/**
 * Lee páginas de producto de laxconsteels.com y las muestra como JSON.
 * Uso: npm run scrape:laxcon -- <url> [<url> ...]
 *
 * Solo lectura: no escribe en la base. Una petición por vez, con pausa, y un
 * User-Agent que identifica a ProArq. Antes de usarlo con más páginas, revisar
 * el robots.txt y los términos del sitio.
 */
import TurndownService from "turndown";

import { parseLaxconProduct, type ScrapedProduct } from "./laxcon-parser";

const USER_AGENT = "ProArqResearchBot/0.1 (prueba de catalogo; una peticion por pagina)";
const ALLOWED_HOST = "www.laxconsteels.com";
const PAUSE_MS = 2000;

const converter = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });
converter.remove(["script", "style", "noscript", "iframe", "nav", "footer"]);
converter.remove((node) => node.nodeName.toLowerCase() === "svg");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertAllowed(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== ALLOWED_HOST) {
    throw new Error(`Solo se permite https://${ALLOWED_HOST}: ${url}`);
  }
  if (!parsed.pathname.startsWith("/products/")) {
    throw new Error(`Solo se leen páginas de /products/: ${url}`);
  }
}

async function scrape(url: string): Promise<ScrapedProduct> {
  assertAllowed(url);
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${response.status} en ${url}`);
  return parseLaxconProduct(converter.turndown(await response.text()), url);
}

async function main(): Promise<void> {
  const urls = process.argv.slice(2);
  if (urls.length === 0) throw new Error("Pasá al menos una URL de /products/.");
  const products: ScrapedProduct[] = [];
  for (const [index, url] of urls.entries()) {
    if (index > 0) await sleep(PAUSE_MS);
    products.push(await scrape(url));
  }
  console.log(JSON.stringify(products, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
