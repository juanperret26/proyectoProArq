const WIKIDATA_SOURCE = "wikidata";
const WIKIDATA_ITEM_URL = /^https:\/\/www\.wikidata\.org\/wiki\/Q\d+$/;

/**
 * Enlace a la ficha de Wikidata de un proveedor cargado desde esa fuente.
 * Devuelve null si el proveedor viene de otro origen o si la dirección guardada
 * no es un ítem de Wikidata por https: el valor sale de la base y se usa como
 * `href`, así que solo se acepta ese formato exacto.
 */
export function wikidataProfileUrl(
  sourceSite: string,
  sourceUrl: string | null,
): string | null {
  if (sourceSite !== WIKIDATA_SOURCE || sourceUrl === null) return null;
  return WIKIDATA_ITEM_URL.test(sourceUrl) ? sourceUrl : null;
}

/** Sitio oficial de una empresa de un directorio: cualquier dirección https sin espacios ni comillas. */
const OFFICIAL_SITE = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/[^\s"'<>]*)?$/i;

const STORE_URL_PATTERNS: Readonly<Record<string, RegExp>> = {
  "made-in-china": /^https:\/\/[a-z0-9-]+\.en\.made-in-china\.com\/?$/,
  indiamart: /^https:\/\/www\.indiamart\.com\/[a-z0-9-]+\/?$/,
  kompass: OFFICIAL_SITE,
  dalil: OFFICIAL_SITE,
};

/**
 * Página del proveedor en su marketplace de origen (Made-in-China.com o
 * IndiaMART). Solo se acepta el formato exacto de cada tienda por https: el
 * valor sale de la base y va a `href`.
 */
export function marketplaceStoreUrl(
  sourceSite: string,
  sourceUrl: string | null,
): string | null {
  const pattern = STORE_URL_PATTERNS[sourceSite];
  if (sourceUrl === null || !pattern) return null;
  return pattern.test(sourceUrl) ? sourceUrl : null;
}
