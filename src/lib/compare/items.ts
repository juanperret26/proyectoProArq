import { z } from "zod";

/** Lista de productos a comparar: lógica pura, sin depender del navegador. */

export const MAX_COMPARE_ITEMS = 4;
export const COMPARE_STORAGE_KEY = "proarq:compare";
/** Id del título de /compare: recibe el foco al quitar un producto de la tabla. */
export const COMPARE_TITLE_ID = "compare-title";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CompareItem {
  id: string;
  name: string;
}

const storedItemSchema = z.object({
  id: z.string().regex(UUID),
  name: z.string().max(300),
});

/** Lee `ids` de la URL: lista separada por comas, validada y sin repetidos. */
export function parseCompareIds(raw: string | string[] | undefined): string[] {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text) return [];
  const ids = text.split(",").map((id) => id.trim()).filter((id) => UUID.test(id));
  return [...new Set(ids)].slice(0, MAX_COMPARE_ITEMS);
}

export function toCompareHref(ids: readonly string[]): string {
  return ids.length > 0 ? `/compare?ids=${ids.join(",")}` : "/compare";
}

export function isCompareFull(items: readonly CompareItem[]): boolean {
  return items.length >= MAX_COMPARE_ITEMS;
}

/** Devuelve la misma lista si el producto ya está o si se llegó al límite. */
export function addCompareItem(
  items: readonly CompareItem[],
  item: CompareItem,
): readonly CompareItem[] {
  if (items.some((existing) => existing.id === item.id) || isCompareFull(items)) {
    return items;
  }
  return [...items, item];
}

export function removeCompareItem(
  items: readonly CompareItem[],
  id: string,
): readonly CompareItem[] {
  return items.filter((item) => item.id !== id);
}

/** Restaura la lista guardada en el navegador; ignora todo lo que no sea válido. */
export function parseStoredItems(json: string | null): CompareItem[] {
  if (json === null) return [];
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  const valid = data.flatMap((entry) => {
    const parsed = storedItemSchema.safeParse(entry);
    if (!parsed.success || seen.has(parsed.data.id)) return [];
    seen.add(parsed.data.id);
    return [parsed.data];
  });
  return valid.slice(0, MAX_COMPARE_ITEMS);
}
