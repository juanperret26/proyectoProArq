import type { ReactNode } from "react";

import { countryName, formatQuantity, formatUsd } from "@/lib/catalog/format";
import type { ProductDetail } from "@/lib/catalog/schemas";
import { bestIndexes, type BestDirection } from "@/lib/compare/best";

type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface CompareRow {
  key: string;
  label: string;
  cells: ReactNode[];
  /** Columnas con el mejor valor de la fila; vacío si no hay un mejor. */
  best: number[];
  note?: string;
}

interface RowContext {
  locale: string;
  compare: Translate;
  catalog: Translate;
  /** Nombre traducido de una unidad de venta (m2, ton, ...). */
  unit: (code: string) => string;
}

function rankBy(
  products: readonly ProductDetail[],
  pick: (product: ProductDetail) => number | null,
  direction: BestDirection,
): number[] {
  return bestIndexes(products.map(pick), direction);
}

function priceTiersCell(product: ProductDetail, context: RowContext): ReactNode {
  const unit = context.unit(product.unit);
  return (
    <ul className="flex flex-col gap-1">
      {[...product.price_tiers]
        .sort((a, b) => a.min_qty - b.min_qty)
        .map((tier) => (
          <li key={tier.min_qty} className="tabular-nums">
            <span className="font-semibold">{formatUsd(context.locale, tier.unit_price_usd)}</span>
            <span className="text-ink-soft">
              {" "}
              · {formatQuantity(context.locale, tier.min_qty)}+ {unit}
            </span>
          </li>
        ))}
    </ul>
  );
}

/** Filas comerciales. El precio y el pedido mínimo solo se comparan si la unidad es la misma. */
export function commercialRows(
  products: readonly ProductDetail[],
  context: RowContext,
): CompareRow[] {
  const sameUnit = new Set(products.map((product) => product.unit)).size === 1;
  const unitNote = sameUnit ? undefined : context.compare("differentUnits");

  return [
    {
      key: "price",
      label: context.compare("rows.price"),
      cells: products.map((product) => priceTiersCell(product, context)),
      best: sameUnit ? rankBy(products, (p) => p.price_from_usd, "min") : [],
      note: unitNote,
    },
    {
      key: "moq",
      label: context.compare("rows.moq"),
      cells: products.map(
        (product) =>
          `${formatQuantity(context.locale, product.min_order_qty)} ${context.unit(product.unit)}`,
      ),
      best: sameUnit ? rankBy(products, (p) => p.min_order_qty, "min") : [],
      note: unitNote,
    },
    {
      key: "lead",
      label: context.compare("rows.leadTime"),
      cells: products.map((p) => context.catalog("card.days", { count: p.lead_time_days })),
      best: rankBy(products, (p) => p.lead_time_days, "min"),
    },
  ];
}

export function supplierRows(
  products: readonly ProductDetail[],
  context: RowContext,
): CompareRow[] {
  return [
    {
      key: "country",
      label: context.compare("rows.country"),
      cells: products.map(
        (p) => `${p.supplier.city}, ${countryName(context.locale, p.supplier.country_code)}`,
      ),
      best: [],
    },
    {
      key: "verified",
      label: context.compare("rows.verified"),
      cells: products.map((p) => context.compare(p.supplier.is_verified ? "yes" : "no")),
      best: rankBy(products, (p) => (p.supplier.is_verified ? 1 : 0), "max"),
    },
    {
      key: "certs",
      label: context.compare("rows.certifications"),
      cells: products.map((p) =>
        p.supplier.certs.length > 0
          ? p.supplier.certs.map((entry) => entry.certification.code).join(" · ")
          : context.compare("none"),
      ),
      best: [],
    },
    {
      key: "founded",
      label: context.compare("rows.founded"),
      cells: products.map((p) => p.supplier.founded_year ?? "—"),
      best: [],
    },
    {
      key: "response",
      label: context.compare("rows.responseTime"),
      cells: products.map((p) =>
        p.supplier.response_time_hours !== null
          ? context.compare("hours", { count: p.supplier.response_time_hours })
          : "—",
      ),
      best: rankBy(products, (p) => p.supplier.response_time_hours, "min"),
    },
  ];
}
