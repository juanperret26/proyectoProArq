import { useCallback, useSyncExternalStore } from "react";

import {
  COMPARE_STORAGE_KEY,
  addCompareItem,
  isCompareFull,
  parseStoredItems,
  removeCompareItem,
  type CompareItem,
} from "@/lib/compare/items";

/**
 * Lista de comparación guardada en localStorage. Se comparte entre pestañas
 * y entre todos los botones de la página mediante un almacén externo.
 */

const EMPTY: readonly CompareItem[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; items: readonly CompareItem[] } = {
  raw: null,
  items: EMPTY,
};

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(COMPARE_STORAGE_KEY);
  } catch {
    // Almacenamiento bloqueado (modo privado, políticas del navegador).
    return null;
  }
}

/** Lista en memoria cuando localStorage no deja escribir (modo privado, bloqueo). */
let memoryFallback: readonly CompareItem[] | null = null;

function getSnapshot(): readonly CompareItem[] {
  if (memoryFallback !== null) return memoryFallback;
  const raw = readRaw();
  if (raw !== cache.raw) {
    cache = { raw, items: raw === null ? EMPTY : parseStoredItems(raw) };
  }
  return cache.items;
}

function getServerSnapshot(): readonly CompareItem[] {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function write(items: readonly CompareItem[]): void {
  try {
    window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
    memoryFallback = null;
  } catch {
    // Sin almacenamiento la lista no persiste, pero la sesión sigue funcionando.
    memoryFallback = items;
  }
  listeners.forEach((listener) => listener());
}

export interface CompareList {
  items: readonly CompareItem[];
  isFull: boolean;
  has: (id: string) => boolean;
  add: (item: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export function useCompareList(): CompareList {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const has = useCallback((id: string) => items.some((item) => item.id === id), [items]);
  const add = useCallback((item: CompareItem) => write(addCompareItem(getSnapshot(), item)), []);
  const remove = useCallback((id: string) => write(removeCompareItem(getSnapshot(), id)), []);
  const clear = useCallback(() => write(EMPTY), []);

  return { items, isFull: isCompareFull(items), has, add, remove, clear };
}
