import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Link } from "@/i18n/navigation";
import { listFavorites } from "@/lib/account/queries";
import { pickLocalized } from "@/lib/i18n/localized";
import { getUserDb } from "@/lib/supabase/user-client";

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <Suspense fallback={<div aria-busy="true" className="h-64 animate-pulse bg-vellum" />}>
        <FavoritesContent />
      </Suspense>
    </div>
  );
}

async function FavoritesContent() {
  const [t, locale, user] = await Promise.all([
    getTranslations("account"),
    getLocale(),
    getUserDb(),
  ]);
  if (!user) return null;
  const favorites = await listFavorites(user);

  return (
    <>
      <Link href="/account" className="link-text">
        {t("backToAccount")}
      </Link>
      <h1 className="mt-4 font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-extrabold leading-none">
        {t("favorites")}
      </h1>
      {favorites.length === 0 ? (
        <div className="mt-8 max-w-[62ch]">
          <p className="font-semibold">{t("noFavoritesTitle")}</p>
          <p className="mt-1 text-ink-soft">{t("noFavoritesBody")}</p>
          <Link href="/search" className="btn btn-outline mt-4 inline-flex">
            {t("browse")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 border-t border-ink">
          {favorites.map(({ id, product }) => (
            <li key={id} className="border-b border-rule py-4">
              <Link href={`/products/${product.id}`} className="link-text font-semibold">
                {pickLocalized(locale, product.name_en, product.name_es)}
              </Link>
              <p className="text-ink-soft">{product.supplier.name}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
