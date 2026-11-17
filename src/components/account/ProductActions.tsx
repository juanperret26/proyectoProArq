import { Heart } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Link } from "@/i18n/navigation";
import { toggleFavorite } from "@/lib/account/actions";
import { isFavorite } from "@/lib/account/queries";
import { getUserDb } from "@/lib/supabase/user-client";

const SECONDARY = "btn btn-outline inline-flex items-center gap-2";

/** Pedir cotización y guardar en favoritos; sin sesión ambos llevan a ingresar. */
export function ProductActions({ productId }: { productId: string }) {
  return (
    <Suspense fallback={<span aria-hidden="true" className="inline-block h-11 w-56" />}>
      <ProductActionsContent productId={productId} />
    </Suspense>
  );
}

async function ProductActionsContent({ productId }: { productId: string }) {
  const [t, locale, user] = await Promise.all([
    getTranslations("account"),
    getLocale(),
    getUserDb(),
  ]);
  const saved = user ? await isFavorite(user, productId) : false;
  const rfqHref = `/rfq/new?product=${productId}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={rfqHref} className="btn btn-primary">
        {t("requestQuote")}
      </Link>
      {user ? (
        <form action={toggleFavorite}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" aria-pressed={saved} className={SECONDARY}>
            <Heart aria-hidden="true" className={`size-4 ${saved ? "fill-current" : ""}`} />
            {saved ? t("removeFavorite") : t("addFavorite")}
          </button>
        </form>
      ) : (
        <Link href={rfqHref} className={SECONDARY}>
          <Heart aria-hidden="true" className="size-4" />
          {t("addFavorite")}
        </Link>
      )}
    </div>
  );
}
