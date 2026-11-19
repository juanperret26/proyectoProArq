/**
 * Ejecuta un SQL de carga de datos de supabase/ dentro de una transacción.
 * Uso: npm run db:run-sql -- supabase/<archivo>.sql
 *
 * Usa SUPABASE_DB_URL de .env.local, igual que `db:seed`. Solo acepta
 * inserciones y actualizaciones (ver sql-guard.ts); si algo falla, revierte todo.
 */
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { Client } from "pg";

import { assertInsertOnlySql } from "./sql-guard";

const SQL_DIR = resolve(__dirname, "../supabase");

function resolveSqlPath(arg: string | undefined): string {
  if (!arg) throw new Error("Pasá el archivo: npm run db:run-sql -- supabase/<archivo>.sql");
  const path = resolve(arg);
  const inside = !relative(SQL_DIR, path).startsWith("..") && path.endsWith(".sql");
  if (!inside) throw new Error(`Solo se ejecutan archivos .sql de supabase/: ${arg}`);
  return path;
}

async function main(): Promise<void> {
  const path = resolveSqlPath(process.argv[2]);
  const sql = readFileSync(path, "utf8");
  assertInsertOnlySql(sql);
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new Error("Falta SUPABASE_DB_URL en .env.local.");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
  } catch (error: unknown) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
  process.stdout.write(`Ejecutado y confirmado: ${relative(process.cwd(), path)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
