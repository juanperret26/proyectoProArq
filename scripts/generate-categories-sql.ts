/**
 * Escribe el SQL que agrega a la base los rubros de src/lib/catalog/taxonomy.ts
 * que todavía no existen. Es repetible (on conflict do nothing) y no borra nada.
 * Uso: npm run db:categories    (después: npm run db:run-sql -- supabase/categories.sql)
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { renderCategories } from "./seed-builder";

const OUTPUT = resolve(__dirname, "../supabase/categories.sql");
const HEADER =
  "-- Generado por scripts/generate-categories-sql.ts. No editar a mano.\n-- Agrega los rubros de la taxonomia que faltan; los existentes no se modifican.\n\n";

writeFileSync(OUTPUT, `${HEADER}${renderCategories()}\n`, "utf8");
process.stderr.write(`${OUTPUT}\n`);
