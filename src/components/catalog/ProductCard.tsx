import { BadgeCheck } from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { CategoryGlyph } from "@/components/CategoryGlyph";
import { CompareButton } from "@/components/compare/CompareButton";
import { Link } from "@/i18n/navigation";
import { lookupCategory } from "@/lib/catalog/category-lookup";
import { countryName, formatUsd, quantityWithUnit } from "@/lib/catalog/format";
import { displayableImages } from "@/lib/catalog/images";
import type { ProductSummary } from "@/lib/catalog/schemas";
import { pickLocalized } from "@/lib/i18n/localized";

type Props = {
  product: ProductSummary;
};

export async function ProductCard({ product }: Props) {
  const t = await getTranslations("catalog");
  const locale = await getLocale();
  const glyph = lookupCategory(product.category_slug)?.top.glyph ?? "bolt";
  const unit = t.has(`units.${product.unit}`)
    ? t(`units.${product.unit}`)
    : product.unit;
  const name = pickLocalized(locale, product.name_en, product.name_es);
  const photo = displayableImages(product.image_urls)[0];

  return (
    <article className="group relative flex w-full flex-col border border-rule bg-paper hover:border-blueline">
      <div className="relative flex h-40 items-center justify-center overflow-hidden border-b border-rule bg-vellum">
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <CategoryGlyph glyph={glyph} className="size-20 text-blueline" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-balance font-semibold leading-snug">
          <Link
            href={`/products/${product.id}`}
            className="after:absolute after:inset-0 hover:underline focus-visible:outline-offset-2"
          >
            {name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-center gap-x-2 text-[0.9375rem] text-ink-soft">
          <span>{product.supplier_name}</span>
          {product.is_verified ? (
            <span className="inline-flex items-center gap-1 text-blueline">
              <BadgeCheck className="size-4" aria-hidden="true" />
              {t("card.verified")}
            </span>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{countryName(locale, product.country_code)}</span>
        </p>
        {product.price_from_usd === null ? (
          <p className="mt-auto pt-2 font-display text-[1.25rem] font-bold leading-none">
            {t("card.priceOnRequest")}
          </p>
        ) : (
          <p className="mt-auto pt-2">
            <span className="text-[0.8125rem] uppercase tracking-wide text-ink-soft">
              {t("card.from")}
            </span>{" "}
            <span className="font-display text-[1.75rem] font-bold leading-none tabular-nums">
              {formatUsd(locale, product.price_from_usd)}
            </span>{" "}
            <span className="text-ink-soft">{t("card.perUnit", { unit })}</span>
          </p>
        )}
        <dl className="grid grid-cols-2 gap-x-3 border-t border-rule pt-3 text-[0.875rem]">
          <div>
            <dt className="text-ink-soft">{t("card.moq")}</dt>
            <dd className="font-semibold tabular-nums">
              {product.min_order_qty === null
                ? t("card.notSpecified")
                : quantityWithUnit(t, product.unit, product.min_order_qty, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-soft">{t("card.leadTime")}</dt>
            <dd className="font-semibold tabular-nums">
              {product.lead_time_days === null
                ? t("card.notSpecified")
                : t("card.days", { count: product.lead_time_days })}
            </dd>
          </div>
        </dl>
        <div>
          <CompareButton
            id={product.id}
            name={name}
            supplierName={product.supplier_name}
          />
        </div>
      </div>
    </article>
  );
}
