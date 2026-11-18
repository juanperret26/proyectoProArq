import { Check } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { ProductDetail } from "@/lib/catalog/schemas";
import { pickLocalized } from "@/lib/i18n/localized";

import { CompareRemoveButton } from "./CompareRemoveButton";
import { commercialRows, supplierRows, type CompareRow } from "./compare-rows";

type Props = {
  products: readonly ProductDetail[];
};

export async function CompareTable({ products }: Props) {
  const [locale, compare, catalog] = await Promise.all([
    getLocale(),
    getTranslations("compare"),
    getTranslations("catalog"),
  ]);
  const context = { locale, compare, catalog };
  const rows: CompareRow[] = [
    ...commercialRows(products, context),
    ...supplierRows(products, context),
  ];
  const names = products.map((p) => pickLocalized(locale, p.name_en, p.name_es));

  return (
    <div
      role="region"
      tabIndex={0}
      aria-labelledby="compare-table-caption"
      className="overflow-x-auto border border-ink"
    >
      <table className="w-full min-w-[40rem] table-fixed border-collapse text-left">
        <caption id="compare-table-caption" className="sr-only">
          {compare("tableLabel")}
        </caption>
        <thead>
          <tr className="border-b border-ink bg-vellum align-top">
            <td className="w-36 p-4 text-[0.875rem] text-ink-soft sm:w-44">{compare("bestHint")}</td>
            {products.map((product, index) => (
              <th key={product.id} scope="col" className="p-4 font-normal">
                <Link
                  href={`/products/${product.id}`}
                  className="block text-balance font-semibold leading-snug underline-offset-4 hover:underline"
                >
                  {names[index]}
                </Link>
                <Link
                  href={`/suppliers/${product.supplier.slug}`}
                  className="mt-1 block text-[0.9375rem] text-ink-soft hover:underline"
                >
                  {product.supplier.name}
                </Link>
                <div className="mt-2">
                  <CompareRemoveButton
                    id={product.id}
                    name={names[index]}
                    remainingIds={products.filter((p) => p.id !== product.id).map((p) => p.id)}
                  />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-rule align-top last:border-b-0">
              <th scope="row" className="p-4 font-semibold">
                {row.label}
                {row.note ? (
                  <span className="mt-1 block text-[0.8125rem] font-normal text-ink-soft">
                    {row.note}
                  </span>
                ) : null}
              </th>
              {row.cells.map((cell, index) => (
                <td
                  key={products[index].id}
                  className={`p-4 tabular-nums ${row.best.includes(index) ? "bg-marker/35 font-semibold" : ""}`}
                >
                  {row.best.includes(index) ? (
                    <span className="mb-1 flex items-center gap-1 text-[0.8125rem] font-semibold text-blueline-deep">
                      <Check className="size-3.5" aria-hidden="true" />
                      {compare("best")}
                    </span>
                  ) : null}
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
