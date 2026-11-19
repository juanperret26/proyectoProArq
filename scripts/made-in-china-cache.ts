/**
 * Caché en disco del scraping: un archivo JSON por proveedor. Permite retomar
 * una corrida interrumpida y volver a clasificar sin repetir peticiones.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { ScrapedProductPage } from "./made-in-china-product-page";

export interface CachedProduct {
  readonly url: string;
  readonly page: ScrapedProductPage | null;
  /** Por qué no hay ficha: error de red, HTTP o página que no es un producto. */
  readonly error: string | null;
}

export interface SupplierCache {
  readonly supplierId: string;
  readonly fetchedAt: string;
  /** Texto del perfil, solo para los proveedores cuyo tipo de empresa no figura. */
  readonly profileText: string | null;
  readonly products: readonly CachedProduct[];
}

function cacheFile(directory: string, supplierId: string): string {
  return join(directory, `${supplierId.replace(/[^A-Za-z0-9_-]/g, "_")}.json`);
}

export function hasCache(directory: string, supplierId: string): boolean {
  return existsSync(cacheFile(directory, supplierId));
}

export function writeCache(directory: string, cache: SupplierCache): void {
  mkdirSync(directory, { recursive: true });
  writeFileSync(cacheFile(directory, cache.supplierId), JSON.stringify(cache), "utf8");
}

export function readCache(directory: string, supplierId: string): SupplierCache | null {
  const file = cacheFile(directory, supplierId);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as SupplierCache) : null;
}
