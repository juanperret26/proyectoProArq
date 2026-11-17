import { locale as rootLocale } from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  // `locale` llega explícito con getTranslations({ locale }), que es la forma
  // de pedir textos donde no hay parámetros de ruta (acciones, route handlers).
  // En páginas y layouts se toma del segmento [locale] de la URL.
  const candidate = locale ?? (await rootLocale());
  const resolved = hasLocale(routing.locales, candidate)
    ? candidate
    : routing.defaultLocale;

  return {
    locale: resolved,
    messages: (await import(`../../messages/${resolved}.json`)).default,
    timeZone: "UTC",
  };
});
