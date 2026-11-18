import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RfqForm } from "@/components/account/RfqForm";
import { quantityWithUnit } from "@/lib/catalog/format";
import { getProductDetail } from "@/lib/catalog/queries";
import { pickLocalized } from "@/lib/i18n/localized";

type Props = {
  searchParams: Promise<{ product?: string | string[] }>;
};

export default function NewRfqPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse bg-vellum" />}>
        <NewRfqContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewRfqContent({ searchParams }: Props) {
  const { product: raw } = await searchParams;
  const productId = typeof raw === "string" ? raw : "";
  const product = await getProductDetail(productId);
  if (!product) notFound();

  const [t, c, locale] = await Promise.all([
    getTranslations("rfq"),
    getTranslations("catalog"),
    getLocale(),
  ]);
  const unit = c.has(`units.${product.unit}`) ? c(`units.${product.unit}`) : product.unit;
  const name = pickLocalized(locale, product.name_en, product.name_es);

  return (
    <>
      <h1 className="font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-extrabold leading-none">
        {t("title")}
      </h1>
      <p className="mt-4 mb-8 max-w-[62ch] text-ink-soft">
        {t("lead", { product: name, supplier: product.supplier.name })}
      </p>
      <RfqForm
        productId={product.id}
        locale={locale}
        unit={unit}
        minOrder={product.min_order_qty}
        minOrderLabel={quantityWithUnit(c, product.unit, product.min_order_qty, locale)}
      />
    </>
  );
}
