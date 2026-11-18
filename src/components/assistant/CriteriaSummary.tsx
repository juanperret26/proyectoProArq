import { getLocale, getTranslations } from "next-intl/server";

import type { ParsedQuery } from "@/lib/assistant/parse";
import { lookupCategory } from "@/lib/catalog/category-lookup";
import { countryName, formatQuantity, formatUsd, quantityWithUnit } from "@/lib/catalog/format";
import { pickLocalized } from "@/lib/i18n/localized";

type Props = {
  parsed: ParsedQuery;
};

/** Lo que el asistente entendió del pedido, para que el comprador lo revise. */
export async function CriteriaSummary({ parsed }: Props) {
  const [t, tCatalog, locale] = await Promise.all([
    getTranslations("assistant"),
    getTranslations("catalog"),
    getLocale(),
  ]);

  const materials = parsed.categorySlugs.flatMap((slug) => {
    const match = lookupCategory(slug);
    return match ? [pickLocalized(locale, match.entry.nameEn, match.entry.nameEs)] : [];
  });

  const rows: [string, string][] = [
    [t("criteria.material"), materials.join(", ") || (parsed.searchTerms?.split(" or ").join(", ") ?? "")],
    [
      t("criteria.quantity"),
      parsed.quantity === null
        ? ""
        : parsed.unit
          ? quantityWithUnit(tCatalog, parsed.unit, parsed.quantity, locale)
          : formatQuantity(locale, parsed.quantity),
    ],
    [
      t("criteria.budget"),
      parsed.budgetUsd !== null ? t("criteria.budgetValue", { price: formatUsd(locale, parsed.budgetUsd) }) : "",
    ],
    [t("criteria.countries"), parsed.countries.map((code) => countryName(locale, code)).join(", ")],
    [t("criteria.certifications"), parsed.certifications.join(", ")],
    [t("criteria.verified"), parsed.verifiedOnly ? t("criteria.yes") : ""],
    [t("criteria.priority"), t(`priority.${parsed.priority}`)],
  ];
  const visible = rows.filter(([, value]) => value !== "");

  return (
    <div className="border border-rule bg-paper p-5">
      <h2 className="font-semibold">{t("criteriaTitle")}</h2>
      <dl className="mt-3 grid gap-x-8 gap-y-2 text-[0.9375rem] sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[0.8125rem] uppercase tracking-wide text-ink-soft">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
