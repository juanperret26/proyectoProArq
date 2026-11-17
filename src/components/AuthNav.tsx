import { Show, UserButton } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Link } from "@/i18n/navigation";

async function SignInLink() {
  const t = await getTranslations("header");
  return (
    <Link href="/sign-in" className="btn btn-quiet">
      {t("signIn")}
    </Link>
  );
}

async function AccountLinks() {
  const t = await getTranslations("header");
  return (
    <>
      <Link href="/account" className="btn btn-quiet">
        {t("account")}
      </Link>
      <UserButton />
    </>
  );
}

/**
 * Acceso o cuenta según la sesión. Leer la sesión es dinámico, por eso va en
 * `Suspense`: mientras carga se muestra "Ingresar", que es lo habitual.
 */
export function AuthNav() {
  return (
    <Suspense fallback={<SignInLink />}>
      <Show when="signed-out">
        <SignInLink />
      </Show>
      <Show when="signed-in">
        <AccountLinks />
      </Show>
    </Suspense>
  );
}
