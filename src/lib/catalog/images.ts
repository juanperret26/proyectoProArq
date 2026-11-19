/**
 * Hosts desde los que la interfaz acepta fotos de producto. `next.config.ts`
 * usa esta misma lista para `images.remotePatterns`: una URL de otro host haría
 * fallar `next/image`, así que se descarta antes de renderizar.
 */
export const IMAGE_HOSTS: readonly string[] = ["image.made-in-china.com"];

function isDisplayable(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && IMAGE_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

/** Fotos que se pueden mostrar con seguridad, en su orden original. */
export function displayableImages(urls: readonly string[]): string[] {
  return urls.filter(isDisplayable);
}
