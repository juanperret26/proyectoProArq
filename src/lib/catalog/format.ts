/** Formato de precios, cantidades y países según el idioma activo. */

export function formatUsd(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 100 ? 2 : 0,
  }).format(value);
}

export function formatQuantity(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

/** Lo que usan las cantidades con unidad: un traductor que sabe si existe una clave. */
export interface QuantityTranslator {
  (key: string, values: { count: number }): string;
  has(key: string): boolean;
}

/**
 * Cantidad con su unidad en singular o plural ("1 bag", "200 bags"). Si la
 * unidad no tiene traducción, muestra el número con el código tal cual.
 */
export function quantityWithUnit(
  t: QuantityTranslator,
  unit: string,
  count: number,
  locale: string,
): string {
  const key = `quantityUnits.${unit}`;
  return t.has(key) ? t(key, { count }) : `${formatQuantity(locale, count)} ${unit}`;
}

export function countryName(locale: string, code: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
