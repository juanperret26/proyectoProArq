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

const MADE_IN_CHINA_SOURCE = "made-in-china";
const MADE_IN_CHINA_STORE_URL = /^https:\/\/[a-z0-9-]+\.en\.made-in-china\.com\/?$/;

/**
 * Página del proveedor en Made-in-China.com. Solo se acepta la tienda por https
 * en el subdominio `.en.made-in-china.com`: el valor sale de la base y va a `href`.
 */
export function madeInChinaStoreUrl(
  sourceSite: string,
  sourceUrl: string | null,
): string | null {
  if (sourceSite !== MADE_IN_CHINA_SOURCE || sourceUrl === null) return null;
  return MADE_IN_CHINA_STORE_URL.test(sourceUrl) ? sourceUrl : null;
}
