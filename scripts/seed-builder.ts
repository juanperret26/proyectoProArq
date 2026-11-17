import { CATEGORY_TAXONOMY } from "../src/lib/catalog/taxonomy";
import {
  CERTIFICATIONS,
  COUNTRIES,
  PRODUCT_TEMPLATES,
  type CountrySeed,
  type ProductTemplate,
  type Variant,
} from "./seed-data";

const SEED_VALUE = 20261116;
const SUPPLIERS_PER_COUNTRY = 12;
const PRODUCTS_PER_SUBCATEGORY = 13;
const PRICE_TIER_FACTORS = [1, 0.94, 0.88] as const;
const PRICE_TIER_QTY_MULTIPLIERS = [1, 5, 20] as const;
const RESPONSE_HOURS = [2, 4, 8, 12, 24, 48] as const;

export interface SeedSupplier {
  slug: string;
  name: string;
  countryCode: string;
  city: string;
  foundedYear: number;
  businessType: "manufacturer" | "trading_company";
  isVerified: boolean;
  responseHours: number;
  descriptionEn: string;
  descriptionEs: string;
  certifications: readonly string[];
}

export interface SeedProduct {
  externalId: string;
  supplierSlug: string;
  categorySlug: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  specs: readonly { label_en: string; label_es: string; value: string }[];
  unit: string;
  minOrder: number;
  leadTimeDays: number;
  priceFrom: number;
  tiers: readonly { minQty: number; unitPrice: number }[];
}

export interface SeedData {
  suppliers: readonly SeedSupplier[];
  products: readonly SeedProduct[];
}

/** Generador pseudoaleatorio determinista: la misma semilla da el mismo seed. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Random = () => number;

function pick<T>(items: readonly T[], random: Random): T {
  return items[Math.floor(random() * items.length)];
}

/** Barajado Fisher-Yates sobre una copia: no modifica la lista original. */
function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function variantText(variant: Variant, locale: "en" | "es"): string {
  if (typeof variant === "string") return variant;
  return locale === "en" ? variant[0] : variant[1];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildSuppliers(random: Random): SeedSupplier[] {
  const certCodes = CERTIFICATIONS.map((c) => c.code);
  return COUNTRIES.flatMap((country) =>
    Array.from({ length: SUPPLIERS_PER_COUNTRY }, (_, index) =>
      buildSupplier(country, index, certCodes, random),
    ),
  );
}

function buildSupplier(
  country: CountrySeed,
  index: number,
  certCodes: readonly string[],
  random: Random,
): SeedSupplier {
  const prefix = country.prefixes[index % country.prefixes.length];
  const suffix = country.suffixes[Math.floor(index / country.prefixes.length)];
  if (!suffix) {
    throw new Error(
      `No hay combinaciones de nombre suficientes para ${country.code}: se pidió el proveedor ${index + 1}.`,
    );
  }
  const name = `${prefix} ${suffix.name}`;
  const city = country.cities[index % country.cities.length];
  const businessType = random() < 0.7 ? "manufacturer" : "trading_company";
  const allowed = certCodes.filter((c) => c !== "BIS" || country.code === "IN");
  const certCount = 1 + Math.floor(random() * 3);
  const certifications = shuffle(allowed, random).slice(0, certCount);
  const kindEn = businessType === "manufacturer" ? "manufacturer" : "trading company";
  const kindEs = businessType === "manufacturer" ? "fabricante" : "empresa comercializadora";
  return {
    slug: slugify(`${prefix}-${suffix.slug}`),
    name,
    countryCode: country.code,
    city,
    foundedYear: 1988 + Math.floor(random() * 29),
    businessType,
    isVerified: random() < 0.6,
    responseHours: pick(RESPONSE_HOURS, random),
    descriptionEn: `${name} is a ${kindEn} based in ${city}, ${country.nameEn}, supplying construction materials to importers and contractors worldwide.`,
    descriptionEs: `${name} es un ${kindEs} con sede en ${city}, ${country.nameEs}, que abastece materiales de construcción a importadores y contratistas de todo el mundo.`,
    certifications,
  };
}

function buildProduct(
  template: ProductTemplate,
  index: number,
  supplier: SeedSupplier,
  random: Random,
  externalId: string,
): SeedProduct {
  const country = COUNTRIES.find((c) => c.code === supplier.countryCode)!;
  const variant = template.variants[index % template.variants.length];
  const en = variantText(variant, "en");
  const es = variantText(variant, "es");
  const nameEn = template.baseEn ? `${template.baseEn} ${en}` : en;
  const nameEs = template.baseEs ? `${template.baseEs} ${es}` : es;
  const basePrice =
    template.price *
    country.priceFactor *
    (0.9 + random() * 0.25) *
    (1 + (index % template.variants.length) * 0.12);
  const tiers = PRICE_TIER_FACTORS.map((factor, tier) => ({
    minQty: template.minOrder * PRICE_TIER_QTY_MULTIPLIERS[tier],
    unitPrice: Math.max(round2(basePrice * factor), 0.01),
  }));
  const standardEn = template.standard ? ` Complies with ${template.standard}.` : "";
  const standardEs = template.standard ? ` Cumple con ${template.standard}.` : "";
  const specs = [
    { label_en: template.specLabel.en, label_es: template.specLabel.es, value: en },
    ...(template.standard
      ? [{ label_en: "Standard", label_es: "Norma", value: template.standard }]
      : []),
  ];
  return {
    externalId,
    supplierSlug: supplier.slug,
    categorySlug: template.slug,
    nameEn: capitalize(nameEn),
    nameEs: capitalize(nameEs),
    descriptionEn: `${capitalize(nameEn)} from ${supplier.name} (${supplier.city}).${standardEn} Minimum order ${template.minOrder} ${template.unit}.`,
    descriptionEs: `${capitalize(nameEs)} de ${supplier.name} (${supplier.city}).${standardEs} Pedido mínimo ${template.minOrder} ${template.unit}.`,
    specs,
    unit: template.unit,
    minOrder: template.minOrder,
    leadTimeDays: country.leadTimeDays + Math.floor(random() * 15),
    priceFrom: tiers[tiers.length - 1].unitPrice,
    tiers,
  };
}

export function buildSeedData(): SeedData {
  const random = createRandom(SEED_VALUE);
  const suppliers = buildSuppliers(random);
  const products = PRODUCT_TEMPLATES.flatMap((template, templateIndex) =>
    Array.from({ length: PRODUCTS_PER_SUBCATEGORY }, (_, index) => {
      const supplier = suppliers[(templateIndex * 7 + index * 5) % suppliers.length];
      const externalId = `seed-p-${String(templateIndex * PRODUCTS_PER_SUBCATEGORY + index + 1).padStart(4, "0")}`;
      return buildProduct(template, index, supplier, random, externalId);
    }),
  );
  return { suppliers, products };
}

const sql = (value: string): string => `'${value.replace(/'/g, "''")}'`;
const values = (rows: readonly string[]): string => rows.join(",\n  ");

export function renderSeedSql(data: SeedData): string {
  const parts: string[] = [
    "-- Generado por scripts/generate-seed.ts. No editar a mano.",
    "-- Reproducible: reemplaza los datos de ejemplo (source_site = 'seed').",
    "-- Falla si ya hay cotizaciones que referencian esos proveedores o productos.",
    "delete from public.products where source_site = 'seed';\ndelete from public.suppliers where source_site = 'seed';",
    renderCountries(),
    renderCategories(),
    renderCertifications(),
    renderSuppliers(data.suppliers),
    renderSupplierCertifications(data.suppliers),
    renderProducts(data.products),
    renderPriceTiers(data.products),
  ];
  return parts.join("\n\n") + "\n";
}

function renderCountries(): string {
  const rows = COUNTRIES.map((c) => `(${sql(c.code)}, ${sql(c.nameEn)}, ${sql(c.nameEs)})`);
  return `insert into public.countries (code, name_en, name_es) values\n  ${values(rows)}\non conflict (code) do nothing;`;
}

function renderCategories(): string {
  const parents = CATEGORY_TAXONOMY.map(
    (c, i) => `(${sql(c.slug)}, ${sql(c.nameEn)}, ${sql(c.nameEs)}, ${i})`,
  );
  const children = CATEGORY_TAXONOMY.flatMap((c) =>
    c.children.map(
      (child, i) =>
        `(${sql(child.slug)}, ${sql(child.nameEn)}, ${sql(child.nameEs)}, ${i}, ${sql(c.slug)})`,
    ),
  );
  return [
    `insert into public.categories (slug, name_en, name_es, position) values\n  ${values(parents)}\non conflict (slug) do nothing;`,
    `insert into public.categories (slug, name_en, name_es, position, parent_id)\nselect v.slug, v.name_en, v.name_es, v.position, p.id\nfrom (values\n  ${values(children)}\n) as v (slug, name_en, name_es, position, parent_slug)\njoin public.categories p on p.slug = v.parent_slug\non conflict (slug) do nothing;`,
  ].join("\n\n");
}

function renderCertifications(): string {
  const rows = CERTIFICATIONS.map((c) => `(${sql(c.code)}, ${sql(c.name)})`);
  return `insert into public.certifications (code, name) values\n  ${values(rows)}\non conflict (code) do nothing;`;
}

function renderSuppliers(suppliers: readonly SeedSupplier[]): string {
  const rows = suppliers.map(
    (s) =>
      `(${sql(s.slug)}, ${sql(s.name)}, ${sql(s.countryCode)}, ${sql(s.city)}, ${s.foundedYear}, ${sql(s.businessType)}, ${s.isVerified}, ${s.responseHours}, ${sql(s.descriptionEn)}, ${sql(s.descriptionEs)}, ${sql(s.slug)})`,
  );
  return `insert into public.suppliers (slug, name, country_code, city, founded_year, business_type, is_verified, response_time_hours, description_en, description_es, source_external_id) values\n  ${values(rows)}\non conflict (slug) do nothing;`;
}

function renderSupplierCertifications(suppliers: readonly SeedSupplier[]): string {
  const rows = suppliers.flatMap((s) =>
    s.certifications.map((code) => `(${sql(s.slug)}, ${sql(code)})`),
  );
  return `insert into public.supplier_certifications (supplier_id, certification_code)\nselect s.id, v.code\nfrom (values\n  ${values(rows)}\n) as v (supplier_slug, code)\njoin public.suppliers s on s.slug = v.supplier_slug\non conflict do nothing;`;
}

function renderProducts(products: readonly SeedProduct[]): string {
  const rows = products.map(
    (p) =>
      `(${sql(p.supplierSlug)}, ${sql(p.categorySlug)}, ${sql(p.nameEn)}, ${sql(p.nameEs)}, ${sql(p.descriptionEn)}, ${sql(p.descriptionEs)}, ${sql(JSON.stringify(p.specs))}, ${sql(p.unit)}, ${p.minOrder}, ${p.leadTimeDays}, ${p.priceFrom}, ${sql(p.externalId)})`,
  );
  return `insert into public.products (supplier_id, category_id, name_en, name_es, description_en, description_es, specs, unit, min_order_qty, lead_time_days, price_from_usd, source_external_id)\nselect s.id, c.id, v.name_en, v.name_es, v.description_en, v.description_es, v.specs::jsonb, v.unit, v.min_order_qty, v.lead_time_days, v.price_from_usd, v.external_id\nfrom (values\n  ${values(rows)}\n) as v (supplier_slug, category_slug, name_en, name_es, description_en, description_es, specs, unit, min_order_qty, lead_time_days, price_from_usd, external_id)\njoin public.suppliers s on s.slug = v.supplier_slug\njoin public.categories c on c.slug = v.category_slug\non conflict (source_site, source_external_id) do nothing;`;
}

function renderPriceTiers(products: readonly SeedProduct[]): string {
  const rows = products.flatMap((p) =>
    p.tiers.map((t) => `(${sql(p.externalId)}, ${t.minQty}, ${t.unitPrice})`),
  );
  return `insert into public.price_tiers (product_id, min_qty, unit_price_usd)\nselect p.id, v.min_qty, v.unit_price_usd\nfrom (values\n  ${values(rows)}\n) as v (external_id, min_qty, unit_price_usd)\njoin public.products p on p.source_site = 'seed' and p.source_external_id = v.external_id\non conflict do nothing;`;
}
