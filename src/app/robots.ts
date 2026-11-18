import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo/site";

/** Las páginas privadas y de ingreso no se indexan. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/en/account",
        "/es/account",
        "/en/rfq",
        "/es/rfq",
        "/en/sign-in",
        "/es/sign-in",
        "/en/sign-up",
        "/es/sign-up",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
