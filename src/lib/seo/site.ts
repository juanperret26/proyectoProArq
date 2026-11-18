import { routing } from "@/i18n/routing";

const FALLBACK_SITE_URL = "http://localhost:3000";
export const DESCRIPTION_MAX_LENGTH = 160;
/** Para avisar una sola vez por proceso y no en cada página. */
let warnedMissingSiteUrl = false;

/**
 * Dirección pública del sitio, sin barra final. Si falta o no es una URL, usa
 * localhost; en producción eso dejaría sitemap y canónicas apuntando a una
 * dirección que no existe, así que se avisa en el registro del servidor.
 */
export function siteUrl(raw: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // Cae al aviso de abajo.
    }
  }
  if (process.env.NODE_ENV === "production" && !warnedMissingSiteUrl) {
    warnedMissingSiteUrl = true;
    console.warn("NEXT_PUBLIC_SITE_URL falta o no es una URL: el sitemap y las canónicas usan localhost.");
  }
  return FALLBACK_SITE_URL;
}

/** URL absoluta de una ruta sin idioma ("/" es la portada). */
export function localizedUrl(base: string, locale: string, path: string): string {
  return `${base}/${locale}${path === "/" ? "" : path}`;
}

export interface PageAlternates {
  canonical: string;
  languages: Record<string, string>;
}

/** Canónica de la página en su idioma y enlaces a las demás versiones (hreflang). */
export function alternatesFor(base: string, locale: string, path: string): PageAlternates {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((code) => [code, localizedUrl(base, code, path)]),
  );
  languages["x-default"] = localizedUrl(base, routing.defaultLocale, path);
  return { canonical: localizedUrl(base, locale, path), languages };
}

/** Descripción para buscadores: una sola línea, cortada en una palabra. */
export function truncateDescription(text: string, max: number = DESCRIPTION_MAX_LENGTH): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
