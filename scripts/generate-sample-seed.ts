import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildSeedData,
  renderSeedSql,
  type SeedData,
  type SeedProduct,
  type SeedSupplier,
} from "./seed-builder";

const OUTPUT_PATH = resolve(__dirname, "../supabase/seed-sample.sql");
const SUPPLIERS_PER_COUNTRY = 1;
const PRODUCTS_PER_SUPPLIER = 3;

/** Primeros proveedores de cada país, para cubrir los cinco orígenes con pocos datos. */
function pickSuppliers(suppliers: readonly SeedSupplier[]): readonly SeedSupplier[] {
  const countries = [...new Set(suppliers.map((s) => s.countryCode))];
  return countries.flatMap((code) =>
    suppliers.filter((s) => s.countryCode === code).slice(0, SUPPLIERS_PER_COUNTRY),
  );
}

/** Hasta N productos del proveedor, cada uno de una categoría distinta. */
function pickProducts(
  supplier: SeedSupplier,
  products: readonly SeedProduct[],
): readonly SeedProduct[] {
  const own = products.filter((p) => p.supplierSlug === supplier.slug);
  return own
    .filter((p, index) => own.findIndex((q) => q.categorySlug === p.categorySlug) === index)
    .slice(0, PRODUCTS_PER_SUPPLIER);
}

export function buildSampleData(full: SeedData): SeedData {
  const suppliers = pickSuppliers(full.suppliers);
  const products = suppliers.flatMap((s) => pickProducts(s, full.products));
  return { suppliers, products };
}

const sample = buildSampleData(buildSeedData());
writeFileSync(OUTPUT_PATH, renderSeedSql(sample), "utf8");

process.stdout.write(
  `seed-sample.sql: ${sample.suppliers.length} proveedores, ${sample.products.length} productos\n`,
);
