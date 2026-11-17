export type BestDirection = "min" | "max";

/**
 * Índices con el mejor valor de una fila del comparador. No resalta nada si
 * hay menos de dos valores comparables o si todos son iguales: no hay mejor.
 */
export function bestIndexes(
  values: readonly (number | null)[],
  direction: BestDirection,
): number[] {
  const comparable = values.flatMap((value, index) =>
    value === null ? [] : [{ value, index }],
  );
  if (comparable.length < 2) return [];

  const numbers = comparable.map((entry) => entry.value);
  const best = direction === "min" ? Math.min(...numbers) : Math.max(...numbers);
  const worst = direction === "min" ? Math.max(...numbers) : Math.min(...numbers);
  if (best === worst) return [];

  return comparable.filter((entry) => entry.value === best).map((entry) => entry.index);
}
