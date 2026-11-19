/**
 * Convierte el CSV del scraper de Made-in-China.com en filas listas para la
 * BD de ProArq. Funciones puras: no leen archivos ni tocan la red.
 *
 * El CSV no trae país, ciudad, tipo de empresa ni plazo de entrega: los datos
 * de empresa vienen de perfiles curados (made-in-china-profiles.ts) y el
 * resto se completa con supuestos documentados en el SQL generado.
 */

export const SOURCE_SITE = "made-in-china";
/** El listado no publica plazo de entrega; la ficha de ejemplo daba 15 días hábiles. */
export const DEFAULT_LEAD_TIME_DAYS = 15;

const COUNTRY_CODE = "CN";
const CURRENCY = "US$";

const REQUIRED_COLUMNS = [
  "company_id",
  "company_name",
  "company_url",
  "currency",
  "category",
  "min_order",
  "min_price",
  "max_price",
  "product_id",
  "product_name",
  "product_url",
] as const;

/** Rubro del sitio -> slug de la taxonomía de ProArq. */
const CATEGORY_SLUGS: Readonly<Record<string, string>> = {
  "Floor Tile": "porcelain-tiles",
  "Glazed Tile": "porcelain-tiles",
};

const UNIT_CODES: Readonly<Record<string, string>> = {
  "square meter": "m2",
  "square meters": "m2",
  piece: "piece",
  pieces: "piece",
  ton: "ton",
  tons: "ton",
  "metric ton": "ton",
  "metric tons": "ton",
};

const UNIT_LABELS: Readonly<Record<string, { en: string; es: string }>> = {
  m2: { en: "m²", es: "m²" },
  piece: { en: "pieces", es: "piezas" },
  ton: { en: "tons", es: "toneladas" },
};

/** Especificaciones que el sitio repite en todos los productos y no informan. */
const SKIPPED_SPEC_LABELS: ReadonlySet<string> = new Set(["after-sales service", "warranty"]);

const SPEC_LABELS_ES: Readonly<Record<string, string>> = {
  material: "Material",
  type: "Tipo",
  size: "Tamaño",
  thickness: "Espesor",
  "surface treatment": "Tratamiento de superficie",
  style: "Estilo",
  color: "Color",
  usage: "Uso",
  shape: "Forma",
  "water absorption": "Absorción de agua",
};

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export type BusinessType = "manufacturer" | "trading_company";

export interface SupplierProfile {
  readonly city: string;
  readonly businessType: BusinessType;
  readonly foundedYear: number | null;
  readonly certifications: readonly string[];
}

export interface BuildOptions {
  readonly scrapedAt: string;
  /** Datos de empresa curados a mano, por company_id. */
  readonly profiles: Readonly<Record<string, SupplierProfile>>;
  /** Nombre en español por product_id; sin entrada queda en null. */
  readonly nameEs: Readonly<Record<string, string>>;
}

export interface MicSupplier {
  readonly slug: string;
  readonly name: string;
  readonly countryCode: string;
  readonly city: string;
  readonly foundedYear: number | null;
  readonly businessType: BusinessType;
  readonly certifications: readonly string[];
  readonly descriptionEn: string;
  readonly descriptionEs: string;
  readonly sourceUrl: string;
  readonly externalId: string;
  readonly scrapedAt: string;
}

export interface MicSpec {
  readonly label_en: string;
  readonly label_es: string;
  readonly value: string;
}

export interface MicProduct {
  readonly externalId: string;
  readonly supplierExternalId: string;
  readonly categorySlug: string;
  readonly nameEn: string;
  readonly nameEs: string | null;
  readonly descriptionEn: string;
  readonly descriptionEs: string | null;
  readonly specs: readonly MicSpec[];
  readonly unit: string;
  readonly minOrder: number;
  readonly leadTimeDays: number;
  readonly priceFrom: number;
  readonly tiers: readonly { minQty: number; unitPrice: number }[];
  readonly imageUrls: readonly string[];
  readonly sourceUrl: string;
  readonly scrapedAt: string;
}

export interface MicData {
  readonly suppliers: readonly MicSupplier[];
  readonly products: readonly MicProduct[];
}

type CsvRow = Readonly<Record<string, string>>;

/** CSV según RFC 4180: comillas dobles, comas y saltos de línea dentro de comillas. */
export function parseCsv(text: string): CsvRow[] {
  const records = splitRecords(text.replace(/^﻿/, ""));
  const [header, ...body] = records;
  if (!header) return [];
  return body.map((cells, index) => {
    if (cells.length !== header.length) {
      throw new Error(
        `Fila ${index + 2}: ${cells.length} columnas, el encabezado tiene ${header.length}.`,
      );
    }
    return Object.fromEntries(header.map((name, i) => [name, cells[i]]));
  });
}

function splitRecords(text: string): string[][] {
  const records: string[][] = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  const endCell = (): void => {
    cells = [...cells, cell];
    cell = "";
  };
  const endRecord = (): void => {
    endCell();
    if (cells.length > 1 || cells[0] !== "") records.push(cells);
    cells = [];
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") endCell();
    else if (char === "\n") endRecord();
    else if (char !== "\r") cell += char;
  }
  if (cell !== "" || cells.length > 0) endRecord();
  return records;
}

export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : Number(body.slice(1));
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

/** Las URLs terminan en enlaces e imágenes de la interfaz: solo se aceptan http(s). */
function assertHttpUrl(url: string): string {
  if (!/^https?:\/\//i.test(url.trim())) {
    throw new Error(`URL no permitida (se espera http o https): "${url}".`);
  }
  return url.trim();
}

/** Quita los parámetros de seguimiento (ads_tp, ads_id, ...) de una URL. */
export function cleanUrl(url: string): string {
  const parsed = new URL(assertHttpUrl(url));
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

/** "…_2026-11-19_12-59-30-323.csv" -> "2026-11-19T12:59:30Z", o null si no hay fecha. */
export function scrapedAtFromFileName(fileName: string): string | null {
  const match = /(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})/.exec(fileName);
  return match ? `${match[1]}T${match[2]}:${match[3]}:${match[4]}Z` : null;
}

/** "Material: Porcelain Clay; Size: 600*1200mm" -> pares etiqueta/valor. */
export function parseProperties(raw: string): { label: string; value: string }[] {
  const pairs: { label: string; value: string }[] = [];
  for (const fragment of raw.split(";").map((part) => part.trim())) {
    if (fragment === "") continue;
    const colon = fragment.indexOf(":");
    const last = pairs[pairs.length - 1];
    if (colon === -1) {
      if (last) pairs[pairs.length - 1] = { ...last, value: `${last.value}; ${fragment}` };
      continue;
    }
    pairs.push({ label: fragment.slice(0, colon).trim(), value: fragment.slice(colon + 1).trim() });
  }
  return pairs.filter((pair) => pair.label !== "" && pair.value !== "");
}

export function parseMinOrder(raw: string): { qty: number; unit: string } {
  const match = /^(\d[\d,]*(?:\.\d+)?)\s+(.+)$/.exec(raw.trim());
  if (!match) throw new Error(`Formato de pedido mínimo no reconocido: "${raw}".`);
  const unit = UNIT_CODES[match[2].trim().toLowerCase()];
  if (!unit) throw new Error(`Unidad desconocida en el pedido mínimo: "${raw}".`);
  const qty = Number(match[1].replace(/,/g, ""));
  if (!(qty > 0)) throw new Error(`Cantidad inválida en el pedido mínimo: "${raw}".`);
  return { qty, unit };
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeText(value: string): string {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function requireColumns(row: CsvRow): void {
  for (const column of REQUIRED_COLUMNS) {
    if (!row[column]?.trim()) {
      throw new Error(`Columna obligatoria vacía: ${column} (producto ${row.product_id || "?"}).`);
    }
  }
}

function parsePrices(row: CsvRow): { min: number; max: number } {
  const min = Number(row.min_price);
  const max = Number(row.max_price);
  if (!Number.isFinite(min) || !Number.isFinite(max) || !(min > 0) || min > max) {
    throw new Error(
      `Precio inválido en ${row.product_id}: mínimo "${row.min_price}", máximo "${row.max_price}".`,
    );
  }
  return { min, max };
}

function buildSpecs(properties: string): MicSpec[] {
  return parseProperties(normalizeText(properties))
    .filter((pair) => !SKIPPED_SPEC_LABELS.has(pair.label.toLowerCase()))
    .map((pair) => ({
      label_en: pair.label,
      label_es: SPEC_LABELS_ES[pair.label.toLowerCase()] ?? pair.label,
      value: pair.value,
    }));
}

function describeSupplier(name: string, profile: SupplierProfile): { en: string; es: string } {
  const manufacturer = profile.businessType === "manufacturer";
  const kindEn = manufacturer ? "a manufacturer" : "a trading company";
  const kindEs = manufacturer ? "un fabricante" : "una empresa comercializadora";
  return {
    en: `${name} is ${kindEn} based in ${profile.city}, China. Company profile from Made-in-China.com.`,
    es: `${name} es ${kindEs} con sede en ${profile.city}, China. Perfil de empresa tomado de Made-in-China.com.`,
  };
}

function buildSupplier(row: CsvRow, profile: SupplierProfile, scrapedAt: string): MicSupplier {
  const name = normalizeText(row.company_name);
  const description = describeSupplier(name, profile);
  return {
    slug: slugify(name),
    name,
    countryCode: COUNTRY_CODE,
    city: profile.city,
    foundedYear: profile.foundedYear,
    businessType: profile.businessType,
    certifications: profile.certifications,
    descriptionEn: description.en,
    descriptionEs: description.es,
    sourceUrl: cleanUrl(row.company_url),
    externalId: row.company_id,
    scrapedAt,
  };
}

function describeProduct(
  nameEn: string,
  nameEs: string | null,
  supplier: MicSupplier,
  specs: readonly MicSpec[],
  order: { qty: number; unit: string },
): { en: string; es: string | null } {
  const label = UNIT_LABELS[order.unit];
  const specsEn = specs.map((s) => `${s.label_en}: ${s.value}`).join(". ");
  const specsEs = specs.map((s) => `${s.label_es}: ${s.value}`).join(". ");
  const tail = (text: string): string => (text ? ` ${text}.` : "");
  return {
    en: `${nameEn} from ${supplier.name} (${supplier.city}).${tail(specsEn)} Minimum order ${order.qty} ${label.en}.`,
    es: nameEs
      ? `${nameEs} de ${supplier.name} (${supplier.city}).${tail(specsEs)} Pedido mínimo ${order.qty} ${label.es}.`
      : null,
  };
}

function buildProduct(row: CsvRow, supplier: MicSupplier, options: BuildOptions): MicProduct {
  const categorySlug = CATEGORY_SLUGS[row.category.trim()];
  if (!categorySlug) throw new Error(`Sin categoría de ProArq para "${row.category}" (${row.product_id}).`);
  const order = parseMinOrder(row.min_order);
  const prices = parsePrices(row);
  const nameEn = normalizeText(row.product_name);
  const nameEs = options.nameEs[row.product_id] ?? null;
  const specs = buildSpecs(row.properties ?? "");
  const description = describeProduct(nameEn, nameEs, supplier, specs, order);
  const imageUrl = row.image_url?.trim();
  return {
    externalId: row.product_id,
    supplierExternalId: supplier.externalId,
    categorySlug,
    nameEn,
    nameEs,
    descriptionEn: description.en,
    descriptionEs: description.es,
    specs,
    unit: order.unit,
    minOrder: order.qty,
    leadTimeDays: DEFAULT_LEAD_TIME_DAYS,
    priceFrom: prices.min,
    // El listado solo da un rango sin cantidades: un único tramo al pedido mínimo.
    tiers: [{ minQty: order.qty, unitPrice: prices.max }],
    imageUrls: imageUrl ? [assertHttpUrl(imageUrl)] : [],
    sourceUrl: cleanUrl(row.product_url),
    scrapedAt: options.scrapedAt,
  };
}

export function buildMadeInChinaData(rows: readonly CsvRow[], options: BuildOptions): MicData {
  const suppliers = new Map<string, MicSupplier>();
  const slugOwners = new Map<string, string>();
  const products: MicProduct[] = [];
  for (const row of rows) {
    requireColumns(row);
    if (row.currency.trim() !== CURRENCY) {
      throw new Error(`Moneda no soportada "${row.currency}" en ${row.product_id}: se espera ${CURRENCY}.`);
    }
    let supplier = suppliers.get(row.company_id);
    if (!supplier) {
      const profile = options.profiles[row.company_id];
      if (!profile) throw new Error(`No hay perfil curado para la empresa ${row.company_id}.`);
      supplier = buildSupplier(row, profile, options.scrapedAt);
      const owner = slugOwners.get(supplier.slug);
      if (owner) throw new Error(`El slug "${supplier.slug}" se repite en ${owner} y ${row.company_id}.`);
      slugOwners.set(supplier.slug, row.company_id);
      suppliers.set(row.company_id, supplier);
    }
    products.push(buildProduct(row, supplier, options));
  }
  return { suppliers: [...suppliers.values()], products };
}

export const sql = (value: string): string => `'${value.replace(/'/g, "''")}'`;
const sqlOrNull = (value: string | null): string => (value === null ? "null" : sql(value));
const values = (rows: readonly string[]): string => rows.join(",\n  ");

const HEADER = [
  "-- Generado por scripts/generate-made-in-china-sql.ts. No editar a mano.",
  "-- Proveedores y productos reales de Made-in-China.com (CSV del scraper).",
  "-- Ejecutar una vez en el SQL Editor. Es repetible (on conflict do nothing).",
  "-- Supuestos, por no estar en el CSV:",
  "--  * is_verified = false: la auditoria de terceros del sitio no es verificacion de ProArq.",
  "--  * lead_time_days = 15 en todos los productos: el listado no lo publica.",
  "--  * Un unico tramo de precio al pedido minimo con el precio maximo del listado;",
  "--    price_from_usd es el precio minimo. El sitio no da las cantidades de cada tramo.",
  "--  * Ciudad, tipo de empresa, anio y certificaciones salen de las paginas de empresa.",
  "--  * description_en y description_es se arman con los datos del listado.",
].join("\n");

export function renderMadeInChinaSql(data: MicData): string {
  const parts = [
    HEADER,
    renderSuppliers(data.suppliers),
    renderCertifications(data.suppliers),
    renderProducts(data.products),
    renderPriceTiers(data.products),
  ].filter((part) => part !== "");
  return parts.join("\n\n") + "\n";
}

function renderSuppliers(suppliers: readonly MicSupplier[]): string {
  const rows = suppliers.map(
    (s) =>
      `(${sql(s.slug)}, ${sql(s.name)}, ${sql(s.countryCode)}, ${sql(s.city)}, ${s.foundedYear ?? "null"}, ${sql(s.businessType)}, false, ${sql(s.descriptionEn)}, ${sql(s.descriptionEs)}, ${sql(SOURCE_SITE)}, ${sql(s.sourceUrl)}, ${sql(s.externalId)}, ${sql(s.scrapedAt)}::timestamptz)`,
  );
  return `insert into public.suppliers (slug, name, country_code, city, founded_year, business_type, is_verified, description_en, description_es, source_site, source_url, source_external_id, scraped_at) values\n  ${values(rows)}\non conflict do nothing;`;
}

function renderCertifications(suppliers: readonly MicSupplier[]): string {
  const rows = suppliers.flatMap((s) =>
    s.certifications.map((code) => `(${sql(s.externalId)}, ${sql(code)})`),
  );
  if (rows.length === 0) return "";
  return `insert into public.supplier_certifications (supplier_id, certification_code)\nselect s.id, v.code\nfrom (values\n  ${values(rows)}\n) as v (supplier_external_id, code)\njoin public.suppliers s on s.source_site = ${sql(SOURCE_SITE)} and s.source_external_id = v.supplier_external_id\non conflict do nothing;`;
}

function imageArray(urls: readonly string[]): string {
  return urls.length === 0 ? "'{}'::text[]" : `array[${urls.map(sql).join(", ")}]::text[]`;
}

function renderProducts(products: readonly MicProduct[]): string {
  const rows = products.map(
    (p) =>
      `(${sql(p.supplierExternalId)}, ${sql(p.categorySlug)}, ${sql(p.nameEn)}, ${sqlOrNull(p.nameEs)}, ${sql(p.descriptionEn)}, ${sqlOrNull(p.descriptionEs)}, ${sql(JSON.stringify(p.specs))}, ${sql(p.unit)}, ${p.minOrder}, ${p.leadTimeDays}, ${p.priceFrom}, ${imageArray(p.imageUrls)}, ${sql(p.sourceUrl)}, ${sql(p.externalId)}, ${sql(p.scrapedAt)})`,
  );
  return `insert into public.products (supplier_id, category_id, name_en, name_es, description_en, description_es, specs, unit, min_order_qty, lead_time_days, price_from_usd, image_urls, source_site, source_url, source_external_id, scraped_at)\nselect s.id, c.id, v.name_en, v.name_es, v.description_en, v.description_es, v.specs::jsonb, v.unit, v.min_order_qty, v.lead_time_days, v.price_from_usd, v.image_urls, ${sql(SOURCE_SITE)}, v.source_url, v.external_id, v.scraped_at::timestamptz\nfrom (values\n  ${values(rows)}\n) as v (supplier_external_id, category_slug, name_en, name_es, description_en, description_es, specs, unit, min_order_qty, lead_time_days, price_from_usd, image_urls, source_url, external_id, scraped_at)\njoin public.suppliers s on s.source_site = ${sql(SOURCE_SITE)} and s.source_external_id = v.supplier_external_id\njoin public.categories c on c.slug = v.category_slug\non conflict (source_site, source_external_id) do nothing;`;
}

function renderPriceTiers(products: readonly MicProduct[]): string {
  const rows = products.flatMap((p) =>
    p.tiers.map((t) => `(${sql(p.externalId)}, ${t.minQty}, ${t.unitPrice})`),
  );
  return `insert into public.price_tiers (product_id, min_qty, unit_price_usd)\nselect p.id, v.min_qty, v.unit_price_usd\nfrom (values\n  ${values(rows)}\n) as v (external_id, min_qty, unit_price_usd)\njoin public.products p on p.source_site = ${sql(SOURCE_SITE)} and p.source_external_id = v.external_id\non conflict do nothing;`;
}
