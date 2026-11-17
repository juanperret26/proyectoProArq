/**
 * Filtros de búsqueda del catálogo. Viven en la URL (para poder compartirlos),
 * así que todo lo que llega de ahí se valida antes de usarlo.
 */

export const PAGE_SIZE = 24;
export const MAX_PAGE = 500;
const MAX_QUERY_LENGTH = 120;

export const SORT_OPTIONS = [
  "relevance",
  "price_asc",
  "price_desc",
  "lead_time",
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface SearchFilters {
  q: string | null;
  category: string | null;
  countries: readonly string[];
  priceMin: number | null;
  priceMax: number | null;
  maxMinOrder: number | null;
  maxLeadTime: number | null;
  certifications: readonly string[];
  verifiedOnly: boolean;
  sort: SortOption;
  page: number;
}

export interface SearchRpcArgs {
  search_query: string | null;
  category_slugs: string[] | null;
  country_codes: string[] | null;
  price_min: number | null;
  price_max: number | null;
  max_min_order: number | null;
  max_lead_time_days: number | null;
  certification_codes: string[] | null;
  verified_only: boolean;
  sort_by: SortOption;
  page_size: number;
  page_offset: number;
}

const COUNTRY_CODE = /^[A-Z]{2}$/;
const CERTIFICATION_CODE = /^[A-Z0-9]{2,20}$/;
const CATEGORY_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function toList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function first(value: string | string[] | undefined): string | undefined {
  return toList(value)[0];
}

function parseCodes(
  value: string | string[] | undefined,
  pattern: RegExp,
): string[] {
  return [...new Set(toList(value).filter((code) => pattern.test(code)))];
}

/** Tope de los números de la URL: evita desbordes al pasarlos a la base. */
const MAX_NUMBER = 1_000_000_000;

function parseNonNegative(
  value: string | string[] | undefined,
  { integer = false }: { integer?: boolean } = {},
): number | null {
  const text = first(value);
  if (text === undefined || text.trim() === "") return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_NUMBER) return null;
  if (integer && !Number.isInteger(parsed)) return null;
  return parsed;
}

function parsePage(value: string | string[] | undefined): number {
  const parsed = Number(first(value));
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return Math.min(parsed, MAX_PAGE);
}

function parseSort(value: string | string[] | undefined): SortOption {
  const text = first(value);
  return SORT_OPTIONS.find((option) => option === text) ?? "relevance";
}

function parseQuery(value: string | string[] | undefined): string | null {
  const text = first(value)?.trim().slice(0, MAX_QUERY_LENGTH).trim();
  return text ? text : null;
}

function parseCategory(value: string | string[] | undefined): string | null {
  const text = first(value);
  return text !== undefined && CATEGORY_SLUG.test(text) ? text : null;
}

export function parseSearchFilters(raw: RawSearchParams): SearchFilters {
  return {
    q: parseQuery(raw.q),
    category: parseCategory(raw.category),
    countries: parseCodes(raw.country, COUNTRY_CODE),
    priceMin: parseNonNegative(raw.minPrice),
    priceMax: parseNonNegative(raw.maxPrice),
    maxMinOrder: parseNonNegative(raw.moq),
    maxLeadTime: parseNonNegative(raw.lead, { integer: true }),
    certifications: parseCodes(raw.cert, CERTIFICATION_CODE),
    verifiedOnly: first(raw.verified) === "1",
    sort: parseSort(raw.sort),
    page: parsePage(raw.page),
  };
}

/** Argumentos de la función `search_products`. `category` fija el rubro de la ruta. */
export function toSearchRpcArgs(
  filters: SearchFilters,
  category: string | null = filters.category,
): SearchRpcArgs {
  return {
    search_query: filters.q,
    category_slugs: category ? [category] : null,
    country_codes: filters.countries.length ? [...filters.countries] : null,
    price_min: filters.priceMin,
    price_max: filters.priceMax,
    max_min_order: filters.maxMinOrder,
    max_lead_time_days: filters.maxLeadTime,
    certification_codes: filters.certifications.length
      ? [...filters.certifications]
      : null,
    verified_only: filters.verifiedOnly,
    sort_by: filters.sort,
    page_size: PAGE_SIZE,
    page_offset: (filters.page - 1) * PAGE_SIZE,
  };
}

/** Arma la cadena de consulta omitiendo los valores por defecto. */
export function toQueryString(
  filters: SearchFilters,
  overrides: Partial<SearchFilters> = {},
): string {
  const f = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.category) params.set("category", f.category);
  for (const code of f.countries) params.append("country", code);
  if (f.priceMin !== null) params.set("minPrice", String(f.priceMin));
  if (f.priceMax !== null) params.set("maxPrice", String(f.priceMax));
  if (f.maxMinOrder !== null) params.set("moq", String(f.maxMinOrder));
  if (f.maxLeadTime !== null) params.set("lead", String(f.maxLeadTime));
  for (const code of f.certifications) params.append("cert", code);
  if (f.verifiedOnly) params.set("verified", "1");
  if (f.sort !== "relevance") params.set("sort", f.sort);
  if (f.page > 1) params.set("page", String(f.page));
  return params.toString();
}
