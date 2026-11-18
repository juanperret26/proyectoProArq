import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

/** Páginas que exigen una sesión iniciada (con prefijo de idioma). */
const PROTECTED_PATH = new RegExp(`^/(${routing.locales.join("|")})/(account|rfq)(/|$)`);

export default clerkMiddleware(async (auth, request) => {
  const { pathname, search } = request.nextUrl;
  if (PROTECTED_PATH.test(pathname)) {
    const locale = pathname.split("/")[1];
    const signIn = new URL(`/${locale}/sign-in`, request.url);
    signIn.searchParams.set("redirect_url", `${pathname}${search}`);
    await auth.protect({ unauthenticatedUrl: signIn.toString() });
  }
  return handleI18n(request);
});

export const config = {
  // Todas las rutas salvo API, internos de Next, el ícono de iOS (sin
  // extensión, lo genera apple-icon.tsx) y archivos estáticos.
  matcher: "/((?!api|_next|_vercel|apple-icon|.*\\..*).*)",
};
