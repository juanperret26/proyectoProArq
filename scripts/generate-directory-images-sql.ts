/**
 * Arma el SQL que agrega la foto a los productos de las empresas de Taiwán y
 * Turquía ya cargadas. Uso: npm run db:directory-images
 * Solo escribe el SQL: no toca la base. Solo completa productos sin foto.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { DIRECTORY_IMAGES } from "./directory-images-data";
import { sql } from "./made-in-china-parser";

const OUTPUT = resolve(__dirname, "../supabase/directory-images.sql");

function assertHttps(id: string, url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error(`La imagen de ${id} debe ser https: ${url}`);
  return parsed.href;
}

function main(): void {
  const rows = Object.entries(DIRECTORY_IMAGES).map(
    ([id, url]) => `(${sql(id)}, ${sql(assertHttps(id, url))})`,
  );
  const text = [
    "-- Generado por scripts/generate-directory-images-sql.ts. No editar a mano.",
    "-- Fotos de producto tomadas del sitio oficial de cada empresa. Solo completa productos sin foto.",
    "update public.products p",
    "set image_urls = array[v.url]",
    `from (values\n  ${rows.join(",\n  ")}\n) as v (external_id, url)`,
    "where p.source_site in ('kompass', 'dalil')",
    "  and p.source_external_id = v.external_id",
    "  and cardinality(p.image_urls) = 0;",
    "",
  ].join("\n");
  writeFileSync(OUTPUT, text, "utf8");
  process.stderr.write(`${rows.length} fotos\nSQL: ${OUTPUT}\n`);
}

try {
  main();
} catch (error: unknown) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
