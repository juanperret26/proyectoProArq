/**
 * Convierte el CSV del scraper de Made-in-China.com en SQL para cargar el catálogo.
 * Uso: npm run db:made-in-china -- <archivo.csv> [<salida.sql>]
 *
 * Solo lee el CSV y escribe el SQL: no toca la base. Revisar el SQL y
 * ejecutarlo a mano en el SQL Editor de Supabase.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

import {
  buildMadeInChinaData,
  parseCsv,
  renderMadeInChinaSql,
  scrapedAtFromFileName,
} from "./made-in-china-parser";
import { PRODUCT_NAMES_ES, SUPPLIER_PROFILES } from "./made-in-china-profiles";

const DEFAULT_OUTPUT = resolve(__dirname, "../supabase/suppliers-made-in-china.sql");

function main(): void {
  const [inputPath, outputArg] = process.argv.slice(2);
  if (!inputPath) throw new Error("Pasá la ruta del CSV: npm run db:made-in-china -- <archivo.csv>");
  const rows = parseCsv(readFileSync(inputPath, "utf8"));
  const scrapedAt =
    scrapedAtFromFileName(basename(inputPath)) ?? new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const data = buildMadeInChinaData(rows, {
    scrapedAt,
    profiles: SUPPLIER_PROFILES,
    nameEs: PRODUCT_NAMES_ES,
  });
  const outputPath = outputArg ? resolve(outputArg) : DEFAULT_OUTPUT;
  writeFileSync(outputPath, renderMadeInChinaSql(data), "utf8");
  process.stdout.write(
    `${outputPath}: ${data.suppliers.length} proveedores, ${data.products.length} productos\n`,
  );
}

try {
  main();
} catch (error: unknown) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
