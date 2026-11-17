import { defineRouting } from "next-intl/routing";

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  // El inglés es el idioma principal: no se elige idioma según el navegador.
  // El español se activa solo con el botón de traducción.
  localeDetection: false,
});
