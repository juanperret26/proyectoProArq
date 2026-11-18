import type { ProductSummary } from "@/lib/catalog/schemas";

/** Qué pesa más al ordenar los candidatos. */
export type Priority = "price" | "lead_time" | "balanced";

export interface RankCriteria {
  priority: Priority;
  /** Cantidad que pide el comprador, en la unidad del producto. */
  quantity: number | null;
  /** Unidad de la cantidad; si es distinta a la del producto, no se compara el pedido mínimo. */
  unit: string | null;
  /** Precio máximo por unidad en USD. */
  budgetUsd: number | null;
}

/** Motivos que la interfaz traduce; el ranking nunca devuelve texto. */
export type ReasonCode =
  | "cheapest"
  | "fastest"
  | "verified"
  | "withinBudget"
  | "meetsMinOrder"
  | "minOrderAboveQuantity";

export interface RankedProduct {
  product: ProductSummary;
  /** Entre 0 y 1; más alto es mejor. */
  score: number;
  reasons: ReasonCode[];
}

interface Weights {
  price: number;
  leadTime: number;
  verified: number;
}

const WEIGHTS: Record<Priority, Weights> = {
  price: { price: 0.6, leadTime: 0.2, verified: 0.2 },
  lead_time: { price: 0.2, leadTime: 0.6, verified: 0.2 },
  balanced: { price: 0.4, leadTime: 0.4, verified: 0.2 },
};

/** Un producto que no llega al pedido mínimo conserva solo esta fracción del puntaje. */
const MIN_ORDER_PENALTY = 0.5;
export const DEFAULT_RANK_LIMIT = 5;

interface Range {
  min: number;
  max: number;
}

function rangeOf(values: readonly number[]): Range {
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** 1 para el menor valor, 0 para el mayor; 1 si todos son iguales. */
function lowerIsBetter(value: number, range: Range): number {
  const span = range.max - range.min;
  return span === 0 ? 1 : (range.max - value) / span;
}

/** La cantidad pedida solo se compara si está en la misma unidad que el producto. */
function comparableQuantity(product: ProductSummary, criteria: RankCriteria): number | null {
  if (criteria.quantity === null) return null;
  return criteria.unit === null || criteria.unit === product.unit ? criteria.quantity : null;
}

function failsMinOrder(product: ProductSummary, criteria: RankCriteria): boolean {
  const quantity = comparableQuantity(product, criteria);
  return quantity !== null && product.min_order_qty > quantity;
}

function meetsMinOrder(product: ProductSummary, criteria: RankCriteria): boolean {
  const quantity = comparableQuantity(product, criteria);
  return quantity !== null && product.min_order_qty <= quantity;
}

function reasonsFor(
  product: ProductSummary,
  criteria: RankCriteria,
  price: Range,
  lead: Range,
): ReasonCode[] {
  const checks: [boolean, ReasonCode][] = [
    [price.min < price.max && product.price_from_usd === price.min, "cheapest"],
    [lead.min < lead.max && product.lead_time_days === lead.min, "fastest"],
    [product.is_verified, "verified"],
    [criteria.budgetUsd !== null && product.price_from_usd <= criteria.budgetUsd, "withinBudget"],
    [meetsMinOrder(product, criteria), "meetsMinOrder"],
    [failsMinOrder(product, criteria), "minOrderAboveQuantity"],
  ];
  return checks.filter(([applies]) => applies).map(([, code]) => code);
}

function compareRanked(a: RankedProduct, b: RankedProduct, criteria: RankCriteria): number {
  const tierA = failsMinOrder(a.product, criteria) ? 1 : 0;
  const tierB = failsMinOrder(b.product, criteria) ? 1 : 0;
  return (
    tierA - tierB ||
    b.score - a.score ||
    a.product.price_from_usd - b.product.price_from_usd ||
    a.product.id.localeCompare(b.product.id)
  );
}

/**
 * Ordena candidatos reales de la base de forma determinista. Los productos que
 * no llegan al pedido mínimo van siempre después de los que sí.
 */
export function rankProducts(
  candidates: readonly ProductSummary[],
  criteria: RankCriteria,
  limit: number = DEFAULT_RANK_LIMIT,
): RankedProduct[] {
  if (candidates.length === 0) return [];
  const price = rangeOf(candidates.map((p) => p.price_from_usd));
  const lead = rangeOf(candidates.map((p) => p.lead_time_days));
  const weights = WEIGHTS[criteria.priority];

  const ranked = candidates.map((product): RankedProduct => {
    const base =
      weights.price * lowerIsBetter(product.price_from_usd, price) +
      weights.leadTime * lowerIsBetter(product.lead_time_days, lead) +
      weights.verified * (product.is_verified ? 1 : 0);
    const score = failsMinOrder(product, criteria) ? base * MIN_ORDER_PENALTY : base;
    return { product, score, reasons: reasonsFor(product, criteria, price, lead) };
  });

  return ranked
    .toSorted((a, b) => compareRanked(a, b, criteria))
    .slice(0, Math.max(limit, 0));
}
