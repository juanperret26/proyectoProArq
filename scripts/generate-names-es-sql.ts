/**
 * Une uno o más JSON { "<id de producto>": "<nombre en español>" } y escribe el
 * SQL que los carga. Uso: npm run db:names-es -- <nombres1.json> [<nombres2.json> ...]
 * No toca la base.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { renderNamesEsSql } from "./made-in-china-names";

const OUTPUT = resolve(__dirname, "../supabase/made-in-china-names-es.sql");

function main(): void {
  const files = process.argv.slice(2);
  if (files.length === 0) throw new Error("Pasá al menos un JSON de nombres.");
  const names: Record<string, string> = {};
  for (const file of files) Object.assign(names, JSON.parse(readFileSync(file, "utf8")));
  writeFileSync(OUTPUT, renderNamesEsSql(names), "utf8");
  process.stderr.write(`${OUTPUT}: ${Object.keys(names).length} nombres\n`);
}

try {
  main();
} catch (error: unknown) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
