import { toQueryString, type SearchFilters, type SearchRpcArgs, type SortOption } from "@/lib/catalog/filters";
import { searchWithArgs, type SearchResult } from "@/lib/catalog/queries";

import { mergeCriteria, type ExtractedCriteria } from "./extract";
import { parseQuery, type ParsedQuery } from "./parse";
import { rankProducts, type Priority, type RankCriteria, type RankedProduct } from "./rank";

/** Cuántos productos reales trae la base para que el ranking elija. */
export const CANDIDATE_LIMIT = 30;
/** Cuántas recomendaciones se muestran. */
export const RESULT_LIMIT = 6;

const SORT_BY_PRIORITY: Record<Priority, SortOption> = {
  price: "price_asc",
  lead_time: "lead_time",
  balanced: "relevance",
};

const orNull = <T>(list: readonly T[]): T[] | null => (list.length > 0 ? [...list] : null);

/** Argumentos de `search_products` para traer candidatos. El pedido mínimo no filtra: lo pesa el ranking. */
export function toCandidateArgs(parsed: ParsedQuery): SearchRpcArgs {
  return {
    search_query: parsed.searchTerms,
    category_slugs: orNull(parsed.categorySlugs),
    country_codes: orNull(parsed.countries),
    price_min: null,
    price_max: parsed.budgetUsd,
    max_min_order: null,
    max_lead_time_days: null,
    certification_codes: orNull(parsed.certifications),
    verified_only: parsed.verifiedOnly,
    sort_by: "relevance",
    page_size: CANDIDATE_LIMIT,
    page_offset: 0,
  };
}

export function toRankCriteria(parsed: ParsedQuery): RankCriteria {
  return {
    priority: parsed.priority,
    quantity: parsed.quantity,
    unit: parsed.unit,
    budgetUsd: parsed.budgetUsd,
  };
}

/** Enlace al catálogo con los mismos filtros, para que el comprador los ajuste ahí. */
export function toCatalogHref(parsed: ParsedQuery): string {
  const [category] = parsed.categorySlugs;
  const filters: SearchFilters = {
    q: category ? null : parsed.searchTerms,
    category: null,
    countries: parsed.countries,
    priceMin: null,
    priceMax: parsed.budgetUsd,
    maxMinOrder: null,
    maxLeadTime: null,
    certifications: parsed.certifications,
    verifiedOnly: parsed.verifiedOnly,
    sort: SORT_BY_PRIORITY[parsed.priority],
    page: 1,
  };
  const query = toQueryString(filters);
  const path = category ? `/categories/${category}` : "/search";
  return query ? `${path}?${query}` : path;
}

/** Por qué no se usó la IA cuando hacía falta: la interfaz lo explica. */
export type AiNotice = "signIn" | "limit";

export type AiOutcome =
  | { status: "ok"; criteria: ExtractedCriteria }
  | { status: AiNotice }
  | { status: "unavailable" };

export type AiFallback = (text: string) => Promise<AiOutcome>;

export type Recommendation =
  | { status: "offTopic"; parsed: ParsedQuery; ai?: AiNotice }
  | {
      status: "ok";
      parsed: ParsedQuery;
      items: RankedProduct[];
      /** Coincidencias totales en la base, antes de recortar. */
      total: number;
      catalogHref: string;
      /** true si los criterios los completó el modelo. */
      aiAssisted: boolean;
    };

/**
 * Arma la respuesta a partir de los candidatos. Si no se reconoció ningún
 * material y el texto libre no encontró nada, el pedido no es del catálogo.
 */
export function toRecommendation(
  parsed: ParsedQuery,
  search: SearchResult,
  aiAssisted = false,
): Recommendation {
  if (parsed.confidence !== "high" && search.items.length === 0) {
    return { status: "offTopic", parsed };
  }
  return {
    status: "ok",
    parsed,
    items: rankProducts(search.items, toRankCriteria(parsed), RESULT_LIMIT),
    total: search.total,
    catalogHref: toCatalogHref(parsed),
    aiAssisted,
  };
}

export interface RecommendDeps {
  search?: (args: SearchRpcArgs) => Promise<SearchResult>;
  /** Sin respaldo, el asistente funciona solo con reglas. */
  aiFallback?: AiFallback;
}

/**
 * Recomendaciones: interpreta el pedido con reglas, trae candidatos reales y
 * los ordena. Solo si el texto libre no encuentra nada se consulta al modelo,
 * una vez, y se vuelve a buscar con sus criterios. Saludos y textos sin
 * contenido no consultan ni la base ni el modelo.
 */
export async function recommend(
  text: string,
  { search = searchWithArgs, aiFallback }: RecommendDeps = {},
): Promise<Recommendation> {
  const parsed = parseQuery(text);
  if (parsed.confidence === "none") return { status: "offTopic", parsed };

  const first = toRecommendation(parsed, await search(toCandidateArgs(parsed)));
  if (first.status === "ok" || !aiFallback) return first;

  const outcome = await aiFallback(text);
  if (outcome.status === "signIn" || outcome.status === "limit") {
    return { status: "offTopic", parsed, ai: outcome.status };
  }
  if (outcome.status !== "ok") return first;

  const merged = mergeCriteria(parsed, outcome.criteria);
  if (merged.confidence === "none") return { status: "offTopic", parsed: merged };
  return toRecommendation(merged, await search(toCandidateArgs(merged)), true);
}
