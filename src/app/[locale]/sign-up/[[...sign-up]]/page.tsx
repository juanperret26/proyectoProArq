import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";

/** La página de registro no aporta nada en los buscadores. */
export const metadata: Metadata = { robots: { index: false } };

export default function SignUpPage() {
  return (
    <div className="mx-auto flex max-w-[1240px] justify-center px-4 py-14 sm:px-6">
      <Suspense fallback={<div aria-busy="true" className="h-96 w-full max-w-96 animate-pulse bg-vellum" />}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}

async function SignUpForm() {
  const locale = await getLocale();
  return <SignUp path={`/${locale}/sign-up`} signInUrl={`/${locale}/sign-in`} />;
}
