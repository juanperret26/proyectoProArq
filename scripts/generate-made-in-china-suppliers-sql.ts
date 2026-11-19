/**
 * Arma el SQL de carga a partir del JSON de proveedores de Made-in-China.com y
 * de la caché del scraping, y reporta qué se cargó y qué se omitió (y por qué).
 * Uso: npm run db:made-in-china-suppliers -- <proveedores.json> <carpeta-cache> [salida.sql] [--names=<nombres-es.json>]
 *
 * Solo lee archivos y escribe el SQL: no toca la base.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { readCache } from "./made-in-china-cache";
import { renderMadeInChinaSql, type MicSupplier } from "./made-in-china-parser";
import { buildProducts, type Omission, type SupplierEntry } from "./made-in-china-products";
import { LOCATION_OVERRIDES } from "./made-in-china-suppliers-overrides";
import {
  buildSupplierFromJson,
  parseSuppliersJson,
  type TypeSource,
} from "./made-in-china-suppliers";

const DEFAULT_OUTPUT = resolve(__dirname, "../supabase/made-in-china-suppliers.sql");
const TOP_GROUPS = 12;

const HEADER = [
  "-- Generado por scripts/generate-made-in-china-suppliers-sql.ts. No editar a mano.",
  "-- Proveedores de Made-in-China.com (busqueda \"construction\") y sus productos principales.",
  "-- Repetible (on conflict do nothing) y sin borrados. Supuestos:",
  "--  * is_verified = false: la auditoria de terceros del sitio no es verificacion de ProArq.",
  "--  * Tipo de empresa: el que publica el sitio; si falta, se infirio del perfil o se asumio",
  "--    trading_company (no afirma que fabriquen).",
  "--  * Ciudad y provincia: las del sitio, corregidas desde la direccion cuando traian basura.",
  "--  * Productos: los que cada proveedor destaca en su portada (hasta 25), solo con precio",
  "--    numerico y que encajan en un rubro de ProArq.",
  "--  * lead_time_days: el de la ficha; 15 si no lo publica.",
  "--  * price_from_usd = precio mas bajo; los tramos son los que publica la ficha (un rango sin",
  "--    cantidades se guarda como un tramo al pedido minimo).",
].join("\n");

function flag(name: string): string | undefined {
  return process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=")[1];
}

function countBy<T>(items: readonly T[], key: (item: T) => string): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function lines(title: string, entries: readonly [string, number][], limit = TOP_GROUPS): string {
  const rows = entries.slice(0, limit).map(([label, count]) => `    ${String(count).padStart(4)}  ${label}`);
  return [`  ${title}`, ...rows].join("\n");
}

function report(
  skipped: readonly { id: string; reason: string }[],
  types: readonly TypeSource[],
  entries: readonly SupplierEntry[],
  products: readonly { supplierExternalId: string; categorySlug: string }[],
  omitted: readonly Omission[],
): string {
  const withProducts = new Set(products.map((product) => product.supplierExternalId));
  const empty = entries.filter(({ supplier }) => !withProducts.has(supplier.externalId));
  return [
    `Proveedores: ${entries.length} cargables, ${skipped.length} omitidos${skipped.map((s) => ` (${s.id}: ${s.reason})`).join("")}`,
    lines("tipo de empresa según", countBy(types, (source) => source)),
    `Productos: ${products.length} cargables, ${omitted.length} omitidos`,
    lines("omitidos por motivo", countBy(omitted, (entry) => entry.reason)),
    lines("cargados por rubro", countBy(products, (product) => product.categorySlug), 40),
    lines("fuera de rubro, por rubro del sitio", countBy(omitted.filter((o) => o.reason === "fuera de rubro"), (o) => o.detail || "(sin rubro)")),
    lines("sin precio, por causa", countBy(omitted.filter((o) => o.reason === "sin precio"), (o) => o.detail)),
    `Proveedores sin ningún producto cargable: ${empty.length} (${empty.map((e) => e.supplier.externalId).join(", ")})`,
  ].join("\n");
}

function main(): void {
  const [jsonPath, cacheArg, outputArg] = process.argv.slice(2).filter((value) => !value.startsWith("--"));
  if (!jsonPath || !cacheArg) throw new Error("Uso: <proveedores.json> <carpeta-cache> [salida.sql] [--names=<nombres-es.json>]");
  const cacheDir = resolve(cacheArg);
  const namesPath = flag("names");
  const nameEs: Record<string, string> = namesPath ? JSON.parse(readFileSync(namesPath, "utf8")) : {};

  const entries: SupplierEntry[] = [];
  const skipped: { id: string; reason: string }[] = [];
  const types: TypeSource[] = [];
  const slugOwners = new Map<string, string>();
  for (const raw of parseSuppliersJson(readFileSync(jsonPath, "utf8"))) {
    const cache = readCache(cacheDir, raw.supplierId);
    const outcome = buildSupplierFromJson(raw, { locationOverrides: LOCATION_OVERRIDES, profileText: cache?.profileText ?? null });
    if (!outcome.ok) {
      skipped.push({ id: raw.supplierId, reason: outcome.reason });
      continue;
    }
    const owner = slugOwners.get(outcome.supplier.slug);
    if (owner) throw new Error(`El slug "${outcome.supplier.slug}" se repite en ${owner} y ${raw.supplierId}.`);
    slugOwners.set(outcome.supplier.slug, raw.supplierId);
    types.push(outcome.typeSource);
    entries.push({ supplier: outcome.supplier, cache });
  }

  const { products, omitted } = buildProducts(entries, nameEs);
  const suppliers: MicSupplier[] = entries.map((entry) => entry.supplier);
  const outputPath = outputArg ? resolve(outputArg) : DEFAULT_OUTPUT;
  writeFileSync(outputPath, renderMadeInChinaSql({ suppliers, products }, HEADER), "utf8");
  process.stderr.write(`${report(skipped, types, entries, products, omitted)}\n\nSQL: ${outputPath}\n`);
}

try {
  main();
} catch (error: unknown) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
