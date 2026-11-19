/**
 * Lee las fichas de producto de Made-in-China.com listadas en el CSV del
 * scraper, extrae las fotos de su galería y escribe el SQL que las guarda.
 * Uso: npm run scrape:made-in-china-images -- <archivo.csv> [<salida.sql>]
 *
 * No toca la base: revisar el SQL y ejecutarlo a mano en el SQL Editor.
 * Una petición por ficha, con pausa, y un User-Agent que identifica a ProArq.
 * Solo se piden URLs de /product/ sin query (el robots.txt del sitio bloquea
 * las URLs con "html?").
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  assertProductPageUrl,
  parseGalleryImages,
  renderImagesSql,
  type ProductImages,
} from "./made-in-china-images";
import { cleanUrl, parseCsv } from "./made-in-china-parser";

const USER_AGENT = "ProArqResearchBot/0.1 (prueba de catalogo; una peticion por pagina)";
const PAUSE_MS = 2000;
const TIMEOUT_MS = 30_000;
const DEFAULT_OUTPUT = resolve(__dirname, "../supabase/products-made-in-china-images.sql");

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}

function log(message: string): void {
  process.stderr.write(`${message}\n`);
}

async function fetchImages(productUrl: string): Promise<string[]> {
  const url = assertProductPageUrl(cleanUrl(productUrl));
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} en ${url}`);
  return parseGalleryImages(await response.text());
}

async function main(): Promise<void> {
  const [inputPath, outputArg] = process.argv.slice(2);
  if (!inputPath) throw new Error("Pasá la ruta del CSV: npm run scrape:made-in-china-images -- <archivo.csv>");
  const rows = parseCsv(readFileSync(inputPath, "utf8"));
  const results: ProductImages[] = [];
  for (const [index, row] of rows.entries()) {
    if (index > 0) await sleep(PAUSE_MS);
    try {
      const imageUrls = await fetchImages(row.product_url);
      log(`${row.product_id}: ${imageUrls.length} fotos`);
      results.push({ externalId: row.product_id, imageUrls });
    } catch (error: unknown) {
      log(`${row.product_id}: omitido (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  const sqlText = renderImagesSql(results);
  if (sqlText === "") throw new Error("No se obtuvo ninguna foto: no se escribió el SQL.");
  const outputPath = outputArg ? resolve(outputArg) : DEFAULT_OUTPUT;
  writeFileSync(outputPath, sqlText, "utf8");
  const saved = results.filter((entry) => entry.imageUrls.length > 0).length;
  log(`${outputPath}: fotos de ${saved} de ${rows.length} productos`);
}

main().catch((error: unknown) => {
  log(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
