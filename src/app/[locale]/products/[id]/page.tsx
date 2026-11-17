import { BadgeCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { Link } from "@/i18n/navigation";
import { lookupCategory } from "@/lib/catalog/category-lookup";
import { countryName, formatQuantity, formatUsd } from "@/lib/catalog/format";
import { getProductDetail } from "@/lib/catalog/queries";
import { pickLocalized } from "@/lib/i18n/localized";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProductPage({ params }: Props) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <Suspense
        fallback={<div aria-busy="true" className="h-96 animate-pulse bg-vellum" />}
      >
        <ProductContent params={params} />
      </Suspense>
    </div>
  );
}

async function ProductContent({ params }: Props) {
  const { id } = await params;
  const product = await getProductDetail(id);
  if (!product) notFound();

  const [locale, t, home, c] = await Promise.all([
    getLocale(),
    getTranslations("product"),
    getTranslations("header"),
    getTranslations("catalog"),
  ]);
  const unit = c.has(`units.${product.unit}`) ? c(`units.${product.unit}`) : product.unit;
  const name = pickLocalized(locale, product.name_en, product.name_es);
  const category = product.category;
  const match = lookupCategory(category.slug);
  const parent = match?.parent ?? null;
  const glyph = match?.top.glyph ?? "bolt";
  const { supplier } = product;
  const certs = supplier.certs.map((entry) => entry.certification);

  const crumbs = [
    { label: home("home"), href: "/" },
    ...(parent
      ? [
          {
            label: pickLocalized(locale, parent.nameEn, parent.nameEs),
            href: `/categories/${parent.slug}`,
          },
        ]
      : []),
    {
      label: pickLocalized(locale, category.name_en, category.name_es),
      href: `/categories/${category.slug}`,
    },
    { label: name },
  ];

  return (
    <>
      <Breadcrumb items={crumbs} />
      <h1 className="mt-5 max-w-[24ch] text-balance font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-extrabold leading-none">
        {name}
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col gap-10">
          <div className="flex h-64 items-center justify-center border border-rule bg-vellum">
            <CategoryGlyph glyph={glyph} className="size-40 text-blueline" />
          </div>

          <section aria-labelledby="description-title">
            <h2 id="description-title" className="font-display text-[1.75rem] font-bold">
              {t("description")}
            </h2>
            <p className="mt-3 max-w-[62ch] leading-relaxed text-ink-soft">
              {pickLocalized(locale, product.description_en, product.description_es)}
            </p>
          </section>

          {product.specs.length > 0 ? (
            <section aria-labelledby="specs-title">
              <h2 id="specs-title" className="font-display text-[1.75rem] font-bold">
                {t("specs")}
              </h2>
              <dl className="mt-3 border-t border-ink">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label_en}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 border-b border-rule py-3"
                  >
                    <dt className="text-ink-soft">
                      {pickLocalized(locale, spec.label_en, spec.label_es)}
                    </dt>
                    <dd className="font-semibold">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="tiers-title" className="border border-ink">
            <h2
              id="tiers-title"
              className="border-b border-ink bg-vellum px-5 py-3 font-display text-[1.5rem] font-bold"
            >
              {t("priceTiers")}
            </h2>
            <table className="w-full text-left">
              <thead className="text-[0.875rem] text-ink-soft">
                <tr>
                  <th scope="col" className="px-5 py-2 font-normal">
                    {t("quantity")}
                  </th>
                  <th scope="col" className="px-5 py-2 text-right font-normal">
                    {t("unitPrice")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {product.price_tiers.map((tier) => (
                  <tr key={tier.min_qty} className="border-t border-rule">
                    <td className="px-5 py-3 tabular-nums">
                      {t("tierQty", { qty: formatQuantity(locale, tier.min_qty), unit })}
                    </td>
                    <td className="px-5 py-3 text-right font-display text-[1.5rem] font-bold tabular-nums">
                      {formatUsd(locale, tier.unit_price_usd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-rule py-5">
            <div>
              <dt className="text-ink-soft">{t("minOrder")}</dt>
              <dd className="font-semibold tabular-nums">
                {formatQuantity(locale, product.min_order_qty)} {unit}
              </dd>
            </div>
            <div>
              <dt className="text-ink-soft">{t("leadTime")}</dt>
              <dd className="font-semibold tabular-nums">
                {c("card.days", { count: product.lead_time_days })}
              </dd>
            </div>
            <div>
              <dt className="text-ink-soft">{t("country")}</dt>
              <dd className="font-semibold">
                {supplier.city}, {countryName(locale, supplier.country_code)}
              </dd>
            </div>
          </dl>

          <section aria-labelledby="supplier-title" className="border border-rule p-5">
            <h2 id="supplier-title" className="text-ink-soft">
              {t("supplier")}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[1.25rem] font-semibold">
              {supplier.name}
              {supplier.is_verified ? (
                <BadgeCheck
                  role="img"
                  className="size-5 text-blueline"
                  aria-label={c("card.verified")}
                />
              ) : null}
            </p>
            <p className="mt-3 text-ink-soft">{t("certifications")}</p>
            <p className="font-semibold">
              {certs.length > 0
                ? certs.map((cert) => cert.code).join(" · ")
                : t("noCertifications")}
            </p>
            <Link href={`/suppliers/${supplier.slug}`} className="link-text mt-4 inline-block">
              {t("viewSupplier")}
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
