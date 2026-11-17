"use client";

import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { toCompareHref } from "@/lib/compare/items";

import { useCompareList } from "./compare-store";

type Props = {
  className?: string;
  children: ReactNode;
};

/** Enlace a la comparación: lleva directo a la URL con los productos elegidos. */
export function CompareNavLink({ className, children }: Props) {
  const { items } = useCompareList();
  return (
    <Link href={toCompareHref(items.map((item) => item.id))} className={className}>
      {children}
    </Link>
  );
}
