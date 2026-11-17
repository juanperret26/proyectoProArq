import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { buildSeedData, renderSeedSql } from "./seed-builder";

const OUTPUT_PATH = resolve(__dirname, "../supabase/seed.sql");

const data = buildSeedData();
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, renderSeedSql(data), "utf8");

process.stdout.write(
  `seed.sql: ${data.suppliers.length} proveedores, ${data.products.length} productos\n`,
);
