import type { Metadata } from "next";
import { Sofia_Sans, Sofia_Sans_Extra_Condensed } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { routing } from "@/i18n/routing";
import "../globals.css";

const sofia = Sofia_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sofia",
  display: "swap",
});

const sofiaExtraCondensed = Sofia_Sans_Extra_Condensed({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sofia-xcond",
  display: "swap",
});

type LocaleParams = Promise<{ locale: string }>;

type LocaleLayoutProps = {
  children: ReactNode;
  params: LocaleParams;
};

export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: { default: t("title"), template: "%s | ProArq" },
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html
      lang={locale}
      className={`${sofia.variable} ${sofiaExtraCondensed.variable}`}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
          >
            {t("skipToContent")}
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
