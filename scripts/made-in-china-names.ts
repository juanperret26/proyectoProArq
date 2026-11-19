/**
 * SQL que carga los nombres en español de los productos de Made-in-China ya
 * cargados. Función pura. Solo completa los que no tienen nombre en español:
 * no pisa traducciones existentes.
 */
import { SOURCE_SITE, sql } from "./made-in-china-parser";

export function renderNamesEsSql(names: Readonly<Record<string, string>>): string {
  const rows = Object.entries(names)
    .filter(([, name]) => name.trim() !== "")
    .map(([id, name]) => `(${sql(id)}, ${sql(name.trim())})`);
  if (rows.length === 0) return "";
  return [
    "-- Generado por scripts/generate-names-es-sql.ts. No editar a mano.",
    "-- Nombres en español de productos de Made-in-China.com. Solo completa los que faltan.",
    "update public.products p",
    "set name_es = v.name_es",
    `from (values\n  ${rows.join(",\n  ")}\n) as v (external_id, name_es)`,
    `where p.source_site = ${sql(SOURCE_SITE)} and p.source_external_id = v.external_id and p.name_es is null;`,
    "",
  ].join("\n");
}
