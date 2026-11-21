/**
 * Arma el SQL de carga de las empresas de Taiwán y Turquía y sus productos.
 * Uso: npm run db:directory -- <empresas.csv> [salida.sql]
 * Solo lee el CSV y escribe el SQL: no toca la base.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildDirectoryGroups } from "./directory-companies";
import { renderCategoryRealignSql, renderMadeInChinaSql } from "./made-in-china-parser";

const DEFAULT_OUTPUT = resolve(__dirname, "../supabase/directory-companies.sql");

const HEADER = [
  "-- Generado por scripts/generate-directory-sql.ts. No editar a mano.",
  "-- Empresas de Taiwan (Kompass) y Turquia (Dalil) y las lineas de producto de su sitio oficial.",
  "-- Repetible (on conflict do nothing) y sin borrados. Supuestos:",
  "--  * is_verified = false; tipo de empresa trading_company: los directorios no lo informan.",
  "--  * Productos sin precio, pedido minimo, plazo ni fotos: las empresas no los publican.",
  "--  * Cada producto es una linea de producto (no un articulo con codigo) tomada del menu de",
  "--    productos del sitio oficial; si no se pudo leer el sitio, la actividad del directorio.",
  "--  * source_url del proveedor = su sitio oficial cuando se pudo verificar.",
].join("\n");

function main(): void {
  const [csvPath, outputArg] = process.argv.slice(2);
  if (!csvPath) throw new Error("Uso: <empresas.csv> [salida.sql]");
  const groups = buildDirectoryGroups(readFileSync(resolve(csvPath), "utf8"));
  const parts = groups.flatMap(({ sourceSite, data }, index) => [
    renderMadeInChinaSql(data, index === 0 ? HEADER : `-- ${sourceSite}`, sourceSite),
    renderCategoryRealignSql(data.products).replaceAll("'made-in-china'", `'${sourceSite}'`),
  ]);
  const outputPath = outputArg ? resolve(outputArg) : DEFAULT_OUTPUT;
  writeFileSync(outputPath, parts.join("\n"), "utf8");
  const lines = groups.map(
    ({ sourceSite, data }) => `${sourceSite}: ${data.suppliers.length} empresas, ${data.products.length} productos`,
  );
  process.stderr.write(`${lines.join("\n")}\nSQL: ${outputPath}\n`);
}

try {
  main();
} catch (error: unknown) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
