/**
 * Extrae las fotos de la galería de una ficha de producto de Made-in-China.com
 * (HTML ya descargado) y arma el SQL que las guarda. Funciones puras: no tocan
 * la red ni la base.
 */
import { displayableImages } from "../src/lib/catalog/images";

import { decodeHtmlEntities, sql, SOURCE_SITE } from "./made-in-china-parser";

export const MAX_GALLERY_IMAGES = 6;

const GALLERY_CLASS = /\bclass="[^"]*\bJ-picImg-zoom-in\b[^"]*"/;
const SITE_DOMAIN = "made-in-china.com";

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`\\s${name}="([^"]*)"`, "i").exec(tag);
  return match ? decodeHtmlEntities(match[1]) : null;
}

function absoluteUrl(src: string): string {
  return src.startsWith("//") ? `https:${src}` : src;
}

/**
 * La galería trae la foto en tamaño medio (prefijo `202…`); la ficha también
 * publica la ampliada (`203…`) con el mismo identificador. Se usa la ampliada
 * solo si aparece en la página, no se supone a partir del prefijo.
 */
function enlargedVersion(html: string, url: string): string {
  const parsed = new URL(url);
  const [, folder, ...rest] = parsed.pathname.split("/");
  const match = /^\d{3}(f0j00.+)$/.exec(folder ?? "");
  if (!match) return url;
  const enlargedFolder = `203${match[1]}`;
  if (!html.includes(`/${enlargedFolder}/`)) return url;
  const candidate = `${parsed.origin}/${enlargedFolder}/${rest.join("/")}`;
  return displayableImages([candidate]).length > 0 ? candidate : url;
}

/** Fotos de la galería principal del producto, en orden y solo de hosts permitidos. */
export function parseGalleryImages(html: string): string[] {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  const found = tags
    .filter((tag) => GALLERY_CLASS.test(tag))
    .map((tag, position) => ({
      src: attribute(tag, "src"),
      order: Number(attribute(tag, "data-index")) || position + 1,
    }))
    .filter((image): image is { src: string; order: number } => image.src !== null)
    .sort((a, b) => a.order - b.order)
    .map((image) => absoluteUrl(image.src));
  const unique = [...new Set(displayableImages(found))];
  return unique.slice(0, MAX_GALLERY_IMAGES).map((url) => enlargedVersion(html, url));
}

/** Solo se leen fichas https del propio sitio, sin parámetros de seguimiento. */
export function assertProductPageUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error(`Se espera https: ${url}`);
  const host = parsed.hostname;
  if (host !== SITE_DOMAIN && !host.endsWith(`.${SITE_DOMAIN}`)) {
    throw new Error(`Host no permitido: ${url}`);
  }
  if (!parsed.pathname.startsWith("/product/")) {
    throw new Error(`Solo se leen fichas /product/: ${url}`);
  }
  if (parsed.search !== "") throw new Error(`La URL debe ir sin query: ${url}`);
  return url;
}

export interface ProductImages {
  readonly externalId: string;
  readonly imageUrls: readonly string[];
}

const IMAGES_HEADER = [
  "-- Generado por scripts/scrape-made-in-china-images.ts. No editar a mano.",
  "-- Fotos de la galeria de cada ficha de Made-in-China.com (solo las URLs; las",
  "-- imagenes se sirven desde el CDN del sitio). Es repetible: reemplaza image_urls.",
].join("\n");

export function renderImagesSql(entries: readonly ProductImages[]): string {
  const rows = entries
    .filter((entry) => entry.imageUrls.length > 0)
    .map((entry) => `(${sql(entry.externalId)}, array[${entry.imageUrls.map(sql).join(", ")}]::text[])`);
  if (rows.length === 0) return "";
  return `${IMAGES_HEADER}\n\nupdate public.products p\nset image_urls = v.image_urls\nfrom (values\n  ${rows.join(",\n  ")}\n) as v (external_id, image_urls)\nwhere p.source_site = ${sql(SOURCE_SITE)} and p.source_external_id = v.external_id;\n`;
}
