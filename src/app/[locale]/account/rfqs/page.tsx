import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Link } from "@/i18n/navigation";
import { listRfqs } from "@/lib/account/queries";
import { formatQuantity } from "@/lib/catalog/format";
import { pickLocalized } from "@/lib/i18n/localized";
import { getUserDb } from "@/lib/supabase/user-client";

export default function RfqsPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <Suspense fallback={<div aria-busy="true" className="h-64 animate-pulse bg-vellum" />}>
        <RfqsContent />
      </Suspense>
    </div>
  );
}

async function RfqsContent() {
  const [t, r, c, locale, user] = await Promise.all([
    getTranslations("account"),
    getTranslations("rfq"),
    getTranslations("catalog"),
    getLocale(),
    getUserDb(),
  ]);
  if (!user) return null;
  const rfqs = await listRfqs(user);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <>
      <Link href="/account" className="link-text">
        {t("backToAccount")}
      </Link>
      <h1 className="mt-4 font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-extrabold leading-none">
        {t("rfqs")}
      </h1>
      {rfqs.length === 0 ? (
        <div className="mt-8 max-w-[62ch]">
          <p className="font-semibold">{t("noRfqsTitle")}</p>
          <p className="mt-1 text-ink-soft">{t("noRfqsBody")}</p>
          <Link href="/search" className="btn btn-outline mt-4 inline-flex">
            {t("browse")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 border-t border-ink">
          {rfqs.map((rfq) => (
            <li key={rfq.id} className="border-b border-rule py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <p className="text-[1.125rem] font-semibold">{rfq.supplier.name}</p>
                <p className="text-ink-soft tabular-nums">
                  {date.format(new Date(rfq.created_at))} ·{" "}
                  {r.has(`status.${rfq.status}`) ? r(`status.${rfq.status}`) : rfq.status}
                </p>
              </div>
              <ul className="mt-2">
                {rfq.items.map((item) => (
                  <li key={item.product.id}>
                    <Link href={`/products/${item.product.id}`} className="link-text">
                      {pickLocalized(locale, item.product.name_en, item.product.name_es)}
                    </Link>{" "}
                    <span className="tabular-nums text-ink-soft">
                      ×{" "}
                      {formatQuantity(locale, item.quantity)}{" "}
                      {c.has(`units.${item.product.unit}`)
                        ? c(`units.${item.product.unit}`)
                        : item.product.unit}
                    </span>
                  </li>
                ))}
              </ul>
              {rfq.destination ? (
                <p className="mt-2 text-ink-soft">
                  {r("destination")}: {rfq.destination}
                </p>
              ) : null}
              <p className="mt-2 max-w-[70ch] whitespace-pre-line">{rfq.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
