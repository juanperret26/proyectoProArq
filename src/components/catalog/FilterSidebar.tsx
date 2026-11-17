import Form from "next/form";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { countryName } from "@/lib/catalog/format";
import { SORT_OPTIONS, type SearchFilters } from "@/lib/catalog/filters";
import type { FilterOptions } from "@/lib/catalog/queries";

type Props = {
  filters: SearchFilters;
  options: FilterOptions;
  /** Ruta sin idioma a la que se envía el formulario, p. ej. "/search". */
  basePath: string;
  /** Parámetros fijos que el formulario debe conservar (consulta, rubro). */
  hidden: Readonly<Record<string, string>>;
  /** Destino del enlace "Borrar filtros": la misma página sin filtros. */
  clearHref: string;
};

const fieldClass =
  "h-10 w-full rounded-control border border-rule-strong bg-paper px-3 tabular-nums focus-visible:border-blueline focus-visible:outline-offset-0";

export async function FilterSidebar({
  filters,
  options,
  basePath,
  hidden,
  clearHref,
}: Props) {
  const t = await getTranslations("catalog");
  const locale = await getLocale();

  return (
    <Form
      action={`/${locale}${basePath}`}
      aria-label={t("filtersTitle")}
      className="flex flex-col gap-6 border border-rule p-4"
    >
      <h2 className="font-display text-[1.5rem] font-bold leading-none">
        {t("filtersTitle")}
      </h2>

      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <label className="flex flex-col gap-1.5">
        <span className="font-semibold">{t("sortLabel")}</span>
        <select name="sort" defaultValue={filters.sort} className={fieldClass}>
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`sort.${option}`)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">{t("filters.priceRange")}</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-[0.875rem] text-ink-soft">
            {t("filters.minPrice")}
            <input
              type="number"
              name="minPrice"
              min={0}
              step="any"
              inputMode="decimal"
              defaultValue={filters.priceMin ?? ""}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-[0.875rem] text-ink-soft">
            {t("filters.maxPrice")}
            <input
              type="number"
              name="maxPrice"
              min={0}
              step="any"
              inputMode="decimal"
              defaultValue={filters.priceMax ?? ""}
              className={fieldClass}
            />
          </label>
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="font-semibold">{t("filters.moq")}</span>
        <input
          type="number"
          name="moq"
          min={0}
          step="any"
          inputMode="decimal"
          defaultValue={filters.maxMinOrder ?? ""}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-semibold">{t("filters.lead")}</span>
        <input
          type="number"
          name="lead"
          min={0}
          step={1}
          inputMode="numeric"
          defaultValue={filters.maxLeadTime ?? ""}
          className={fieldClass}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">{t("filters.country")}</legend>
        {options.countries.map((country) => (
          <label key={country.code} className="flex items-center gap-2.5">
            <input
              type="checkbox"
              name="country"
              value={country.code}
              defaultChecked={filters.countries.includes(country.code)}
              className="size-4 accent-blueline"
            />
            {countryName(locale, country.code)}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">{t("filters.certifications")}</legend>
        {options.certifications.map((cert) => (
          <label key={cert.code} className="flex items-center gap-2.5">
            <input
              type="checkbox"
              name="cert"
              value={cert.code}
              defaultChecked={filters.certifications.includes(cert.code)}
              className="size-4 accent-blueline"
            />
            {cert.code}
          </label>
        ))}
      </fieldset>

      <label className="flex items-center gap-2.5 font-semibold">
        <input
          type="checkbox"
          name="verified"
          value="1"
          defaultChecked={filters.verifiedOnly}
          className="size-4 accent-blueline"
        />
        {t("filters.verified")}
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary">
          {t("applyFilters")}
        </button>
        <Link href={clearHref} className="link-text">
          {t("clearFilters")}
        </Link>
      </div>
    </Form>
  );
}
