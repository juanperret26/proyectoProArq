import { SignIn } from "@clerk/nextjs";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-[1240px] justify-center px-4 py-14 sm:px-6">
      <Suspense fallback={<div aria-busy="true" className="h-96 w-full max-w-96 animate-pulse bg-vellum" />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}

async function SignInForm() {
  const locale = await getLocale();
  return <SignIn path={`/${locale}/sign-in`} signUpUrl={`/${locale}/sign-up`} />;
}
