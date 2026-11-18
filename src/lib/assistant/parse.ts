import { CATEGORY_TAXONOMY } from "@/lib/catalog/taxonomy";

import type { Priority } from "./rank";
import {
  CATEGORY_KEYWORDS,
  CERTIFICATION_WORDS,
  COUNTRY_CODES,
  COUNTRY_WORDS,
  NEGATION_WORDS,
  PRICE_WORDS,
  SPEED_WORDS,
  STOP_WORDS,
  UNIT_WORDS,
  VERIFIED_WORDS,
  type Unit,
} from "./vocabulary";

/** Largo máximo que se lee del pedido; el resto se ignora. */
export const MAX_QUERY_LENGTH = 300;
/** Cuántas palabras sueltas se mandan a la búsqueda de texto como respaldo. */
const MAX_SEARCH_TERMS = 6;
/** Hasta cuántas palabras antes de un país puede estar la negación. */
const NEGATION_WINDOW = 3;
const MIN_TERM_LENGTH = 3;

/**
 * - high: se reconoció al menos un rubro del catálogo.
 * - low: no hay rubro, pero quedan palabras para buscar por texto.
 * - none: no hay nada del catálogo (saludo, texto vacío, solo país o cantidad).
 */
export type Confidence = "high" | "low" | "none";

export interface ParsedQuery {
  categorySlugs: string[];
  /** Consulta para `websearch_to_tsquery` cuando no hay rubro; si no, null. */
  searchTerms: string | null;
  quantity: number | null;
  unit: Unit | null;
  budgetUsd: number | null;
  countries: string[];
  certifications: string[];
  verifiedOnly: boolean;
  priority: Priority;
  confidence: Confidence;
}

const UNIT_PATTERN = Object.keys(UNIT_WORDS)
  .toSorted((a, b) => b.length - a.length)
  .join("|");
const QUANTITY_RE = new RegExp(`(\\d+(?:[.,]\\d+)*)\\s*(${UNIT_PATTERN})\\b`);
const BUDGET_RE = /(?:us\$|usd|\$)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:usd|dollars?|dolares?)\b/;
const THOUSANDS_RE = /^\d{1,3}(?:[.,]\d{3})+$/;

/** Minúsculas, sin acentos, "m²" → "m2", solo letras, dígitos, "$", "." y ",". */
function normalize(text: string): string {
  return text
    .slice(0, MAX_QUERY_LENGTH)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9$.,]+/g, " ")
    .trim();
}

function tokenize(normalized: string): string[] {
  return normalized
    .split(" ")
    .map((token) => token.replace(/^[.,]+|[.,]+$/g, ""))
    .filter(Boolean);
}

/** Singular aproximado para inglés y español: "tiles" → "tile", "boxes" → "box". */
export function singular(token: string): string {
  if (token.length <= 3) return token;
  if (/(?:ch|sh|x|z)es$/.test(token)) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

/** "1.000" y "1,000" son mil; "2,5" y "2.5" son dos y medio. */
function parseNumber(raw: string): number {
  if (THOUSANDS_RE.test(raw)) return Number(raw.replace(/[.,]/g, ""));
  return Number(raw.replace(",", "."));
}

function readQuantity(normalized: string): { quantity: number | null; unit: Unit | null } {
  const match = QUANTITY_RE.exec(normalized);
  if (!match) return { quantity: null, unit: null };
  return { quantity: parseNumber(match[1]), unit: UNIT_WORDS[match[2]] };
}

function readBudget(normalized: string): number | null {
  const match = BUDGET_RE.exec(normalized);
  const raw = match?.[1] ?? match?.[2];
  return raw ? parseNumber(raw) : null;
}

function readCategories(words: readonly string[]): string[] {
  const text = ` ${words.join(" ")} `;
  const found = new Set(
    Object.entries(CATEGORY_KEYWORDS)
      .filter(([keyword]) => text.includes(` ${keyword} `))
      .flatMap(([, slugs]) => slugs),
  );
  const redundantParents = CATEGORY_TAXONOMY.filter(
    (parent) => found.has(parent.slug) && parent.children.some((c) => found.has(c.slug)),
  ).map((parent) => parent.slug);
  return [...found].filter((slug) => !redundantParents.includes(slug));
}

function isNegated(tokens: readonly string[], index: number): boolean {
  return tokens
    .slice(Math.max(0, index - NEGATION_WINDOW), index)
    .some((token) => NEGATION_WORDS.has(token));
}

function readCountries(tokens: readonly string[]): string[] {
  const included = new Set<string>();
  const excluded = new Set<string>();
  tokens.forEach((token, index) => {
    const code = COUNTRY_WORDS[singular(token)] ?? COUNTRY_WORDS[token];
    if (code) (isNegated(tokens, index) ? excluded : included).add(code);
  });
  const base = included.size > 0 ? [...included] : excluded.size > 0 ? [...COUNTRY_CODES] : [];
  return base.filter((code) => !excluded.has(code));
}

function readCertifications(tokens: readonly string[]): string[] {
  const joined = tokens.map((token, i) =>
    token === "iso" && /^\d+$/.test(tokens[i + 1] ?? "") ? `iso${tokens[i + 1]}` : token,
  );
  const codes = joined.map((token) => CERTIFICATION_WORDS[token]).filter(Boolean);
  return [...new Set(codes)];
}

function readPriority(words: readonly string[]): Priority {
  const wantsPrice = words.some((word) => PRICE_WORDS.has(word));
  const wantsSpeed = words.some((word) => SPEED_WORDS.has(word));
  if (wantsPrice === wantsSpeed) return "balanced";
  return wantsPrice ? "price" : "lead_time";
}

function isKnownWord(token: string): boolean {
  const word = singular(token);
  return [token, word].some(
    (w) =>
      STOP_WORDS.has(w) ||
      NEGATION_WORDS.has(w) ||
      VERIFIED_WORDS.has(w) ||
      PRICE_WORDS.has(w) ||
      SPEED_WORDS.has(w) ||
      w in COUNTRY_WORDS ||
      w in CERTIFICATION_WORDS ||
      w in UNIT_WORDS,
  );
}

/** Palabras sueltas para buscar por texto, unidas con "or" para no exigir todas. */
function readSearchTerms(tokens: readonly string[]): string | null {
  const terms = tokens.filter(
    (token) => token.length >= MIN_TERM_LENGTH && !/[\d$]/.test(token) && !isKnownWord(token),
  );
  const unique = [...new Set(terms)].slice(0, MAX_SEARCH_TERMS);
  return unique.length > 0 ? unique.join(" or ") : null;
}

/**
 * Convierte un pedido en texto libre (EN o ES) en criterios de búsqueda, sin IA.
 * La confianza indica si vale la pena buscar o pedir ayuda a un modelo.
 */
export function parseQuery(text: string): ParsedQuery {
  const normalized = normalize(text);
  const tokens = tokenize(normalized);
  const words = tokens.map(singular);
  const categorySlugs = readCategories(words);
  const searchTerms = categorySlugs.length > 0 ? null : readSearchTerms(tokens);

  return {
    categorySlugs,
    searchTerms,
    ...readQuantity(normalized),
    budgetUsd: readBudget(normalized),
    countries: readCountries(tokens),
    certifications: readCertifications(tokens),
    verifiedOnly: words.some((word) => VERIFIED_WORDS.has(word)),
    priority: readPriority(words),
    confidence: categorySlugs.length > 0 ? "high" : searchTerms ? "low" : "none",
  };
}
