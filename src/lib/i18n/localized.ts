/**
 * Elige el texto según el idioma activo. El catálogo guarda cada texto en
 * inglés y en español; si falta la traducción se muestra el inglés, que es
 * el idioma principal del sitio.
 */
export function pickLocalized(
  locale: string,
  en: string,
  es: string | null | undefined,
): string {
  if (locale === "es" && es != null && es.trim() !== "") {
    return es;
  }
  return en;
}
