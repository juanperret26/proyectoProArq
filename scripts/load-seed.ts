import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Client } from "pg";

import { buildSeedData } from "./seed-builder";

const SEED_PATH = resolve(__dirname, "../supabase/seed.sql");

async function main(): Promise<void> {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error(
      "Falta SUPABASE_DB_URL. Defínela en .env.local (Project Settings > Database > Connection string).",
    );
  }

  // El cifrado lo define el propio connection string (sslmode=require).
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(readFileSync(SEED_PATH, "utf8"));
    const { rows } = await client.query<{ products: string; suppliers: string }>(
      "select (select count(*) from public.products) as products, (select count(*) from public.suppliers) as suppliers",
    );
    const expected = buildSeedData();
    const loaded = {
      suppliers: Number(rows[0].suppliers),
      products: Number(rows[0].products),
    };
    if (
      loaded.suppliers !== expected.suppliers.length ||
      loaded.products !== expected.products.length
    ) {
      throw new Error(
        `El seed quedó incompleto: se esperaban ${expected.suppliers.length} proveedores y ${expected.products.length} productos, hay ${loaded.suppliers} y ${loaded.products}.`,
      );
    }
    process.stdout.write(
      `Seed cargado: ${loaded.suppliers} proveedores, ${loaded.products} productos\n`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Error desconocido"}\n`,
  );
  process.exit(1);
});
