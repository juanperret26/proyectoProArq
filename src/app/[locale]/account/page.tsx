import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ProfileForm } from "@/components/account/ProfileForm";
import { Link } from "@/i18n/navigation";
import { getProfile } from "@/lib/account/queries";
import { getUserDb } from "@/lib/supabase/user-client";

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse bg-vellum" />}>
        <AccountContent />
      </Suspense>
    </div>
  );
}

async function AccountContent() {
  const [t, user] = await Promise.all([getTranslations("account"), getUserDb()]);
  if (!user) return null; // el proxy ya envía a ingresar; esto solo cubre una carrera.
  const profile = await getProfile(user);

  return (
    <>
      <h1 className="font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-extrabold leading-none">
        {t("title")}
      </h1>
      <nav aria-label={t("sections")} className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/account/favorites" className="link-text">
          {t("favorites")}
        </Link>
        <Link href="/account/rfqs" className="link-text">
          {t("rfqs")}
        </Link>
      </nav>
      <section aria-labelledby="profile-title" className="mt-10">
        <h2 id="profile-title" className="font-display text-[1.75rem] font-bold">
          {t("profile")}
        </h2>
        <p className="mt-2 mb-6 max-w-[62ch] text-ink-soft">{t("profileLead")}</p>
        <ProfileForm profile={profile} />
      </section>
    </>
  );
}
