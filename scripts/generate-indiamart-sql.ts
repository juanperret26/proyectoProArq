/**
 * Arma el SQL de carga a partir del JSON del scraper de IndiaMART y reporta qué
 * se cargó y qué se omitió. Uso: npm run db:indiamart -- <productos.json> [salida.sql]
 *
 * Solo lee el JSON y escribe el SQL: no toca la base.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildIndiaMartData,
  INDIAMART_SOURCE_SITE,
  INR_TO_USD,
  parseIndiaMartRows,
} from "./indiamart";
import { INDIAMART_NAMES_ES } from "./indiamart-names-es";
import { renderCategoryRealignSql, renderMadeInChinaSql } from "./made-in-china-parser";

const DEFAULT_OUTPUT = resolve(__dirname, "../supabase/indiamart.sql");

const HEADER = [
  "-- Generado por scripts/generate-indiamart-sql.ts. No editar a mano.",
  "-- Proveedores y productos de IndiaMART (JSON del scraper). Repetible (on conflict do nothing) y sin borrados.",
  "-- Supuestos:",
  "--  * is_verified = false: figurar en IndiaMART no es verificacion de ProArq.",
  `--  * Precios en rupias convertidos a USD a ${INR_TO_USD} USD por INR (aprox. 89 INR = 1 USD); 1 lakh = 100.000.`,
  "--  * Precios por pie cuadrado y pedidos minimos en pies cuadrados pasados a m2.",
  "--  * Un unico tramo de precio al pedido minimo; el listado no publica mas tramos.",
  "--  * lead_time_days = 15: el listado no lo publica.",
  "--  * Tipo de empresa: Manufacturer = fabricante; Wholesaler, Retailer o sin dato = comercializadora.",
  "--  * Fotos: la miniatura 250x250 se cambia por la de 500x500 del mismo servidor.",
].join("\n");

function main(): void {
  const [jsonPath, outputArg] = process.argv.slice(2);
  if (!jsonPath) throw new Error("Uso: <productos.json> [salida.sql]");
  const rows = parseIndiaMartRows(readFileSync(resolve(jsonPath), "utf8"));
  const { suppliers, products, omitted } = buildIndiaMartData(rows, { nameEs: INDIAMART_NAMES_ES });

  const untranslated = products.filter((product) => product.nameEs === null);
  if (untranslated.length > 0) {
    throw new Error(`Faltan nombres en español: ${untranslated.map((p) => `${p.externalId} (${p.nameEn})`).join("; ")}`);
  }
  const withProducts = new Set(products.map((product) => product.supplierExternalId));
  const loadable = suppliers.filter((supplier) => withProducts.has(supplier.externalId));

  const outputPath = outputArg ? resolve(outputArg) : DEFAULT_OUTPUT;
  const data = { suppliers: loadable, products };
  const sqlText = `${renderMadeInChinaSql(data, HEADER, INDIAMART_SOURCE_SITE)}\n${renderCategoryRealignSql(products).replaceAll("'made-in-china'", `'${INDIAMART_SOURCE_SITE}'`)}`;
  writeFileSync(outputPath, sqlText, "utf8");

  const lines = [
    `Proveedores: ${loadable.length} cargables de ${suppliers.length} (sin productos cargables: ${suppliers.length - loadable.length})`,
    `Productos: ${products.length} cargables, ${omitted.length} omitidos`,
    ...omitted.map((entry) => `  omitido (${entry.reason}): ${entry.externalId} ${entry.name}`),
    ...products.map((p) => `  ${p.externalId}  ${p.categorySlug.padEnd(26)} ${p.unit.padEnd(5)} ${String(p.minOrder).padStart(9)} @ ${p.priceFrom}  ${p.nameEn}`),
    `SQL: ${outputPath}`,
  ];
  process.stderr.write(`${lines.join("\n")}\n`);
}

try {
  main();
} catch (error: unknown) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
