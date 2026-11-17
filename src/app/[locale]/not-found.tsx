import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <section className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:py-28">
      <h1 className="text-balance font-display text-[clamp(2.5rem,1.5rem+4vw,4.5rem)] font-extrabold leading-[0.95]">
        {t("title")}
      </h1>
      <p className="mt-5 max-w-[48ch] text-[1.1875rem] text-ink-soft">
        {t("body")}
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        {t("home")}
      </Link>
    </section>
  );
}
