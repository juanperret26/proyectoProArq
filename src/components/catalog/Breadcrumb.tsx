import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export interface BreadcrumbItem {
  label: string;
  /** Sin `href` es la página actual. */
  href?: string;
}

export async function Breadcrumb({ items }: { items: readonly BreadcrumbItem[] }) {
  const t = await getTranslations("catalog");

  return (
    <nav aria-label={t("breadcrumb")} className="text-[0.9375rem] text-ink-soft">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="underline-offset-4 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
