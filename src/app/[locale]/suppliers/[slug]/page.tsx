import { BadgeCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { ProductCard } from "@/components/catalog/ProductCard";
import { countryName } from "@/lib/catalog/format";
import { getSupplierDetail, getSupplierProducts } from "@/lib/catalog/queries";
import { pickLocalized } from "@/lib/i18n/localized";

type Props = {
  params: Promise<{ slug: string }>;
};

export default function SupplierPage({ params }: Props) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <Suspense
        fallback={<div aria-busy="true" className="h-96 animate-pulse bg-vellum" />}
      >
        <SupplierContent params={params} />
      </Suspense>
    </div>
  );
}

async function SupplierContent({ params }: Props) {
  const { slug } = await params;
  const supplier = await getSupplierDetail(slug);
  if (!supplier) notFound();

  const [products, locale, t, home] = await Promise.all([
    getSupplierProducts(supplier.id),
    getLocale(),
    getTranslations("supplier"),
    getTranslations("header"),
  ]);
  const certs = supplier.certs.map((entry) => entry.certification);

  return (
    <>
      <Breadcrumb items={[{ label: home("home"), href: "/" }, { label: supplier.name }]} />
      <header className="mt-5 max-w-[70ch]">
        <h1 className="text-balance font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-extrabold leading-none">
          {supplier.name}
        </h1>
        {supplier.is_verified ? (
          <p className="mt-3 inline-flex items-center gap-1.5 font-semibold text-blueline">
            <BadgeCheck className="size-5" aria-hidden="true" />
            {t("verified")}
          </p>
        ) : null}
        <p className="mt-4 leading-relaxed text-ink-soft">
          {pickLocalized(locale, supplier.description_en, supplier.description_es)}
        </p>
      </header>

      <dl className="mt-8 grid gap-x-8 gap-y-4 border-y border-rule py-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-ink-soft">{t("location")}</dt>
          <dd className="font-semibold">
            {supplier.city}, {countryName(locale, supplier.country_code)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-soft">{t("typeLabel")}</dt>
          <dd className="font-semibold">{t(`type.${supplier.business_type}`)}</dd>
        </div>
        {supplier.founded_year ? (
          <div>
            <dt className="text-ink-soft">{t("founded")}</dt>
            <dd className="font-semibold tabular-nums">{supplier.founded_year}</dd>
          </div>
        ) : null}
        {supplier.response_time_hours ? (
          <div>
            <dt className="text-ink-soft">{t("responseTime")}</dt>
            <dd className="font-semibold tabular-nums">
              {t("hours", { count: supplier.response_time_hours })}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-ink-soft">{t("certifications")}</dt>
          <dd className="font-semibold">
            {certs.length > 0
              ? certs.map((cert) => cert.code).join(" · ")
              : t("noCertifications")}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="supplier-products" className="mt-10">
        <h2 id="supplier-products" className="font-display text-[1.75rem] font-bold">
          {t("productsTitle")}
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <li key={product.id} className="flex">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
