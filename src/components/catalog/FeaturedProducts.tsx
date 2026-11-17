import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getFeaturedProducts } from "@/lib/catalog/queries";

import { ProductCard } from "./ProductCard";

const FEATURED_COUNT = 8;

export async function FeaturedProducts() {
  const [products, t] = await Promise.all([
    getFeaturedProducts(FEATURED_COUNT),
    getTranslations("catalog"),
  ]);
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-title"
      className="mx-auto max-w-[1240px] border-t border-rule px-4 py-14 sm:px-6 lg:py-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2
          id="featured-title"
          className="font-display text-[2.25rem] font-bold leading-none"
        >
          {t("featuredTitle")}
        </h2>
        <Link href="/search" className="link-text">
          {t("featuredAll")}
        </Link>
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.id} className="flex">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
