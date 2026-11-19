/**
 * Proveedores del JSON del scraper de Made-in-China.com: validación, limpieza
 * de ubicación, tipo de empresa y certificaciones. Funciones puras.
 */
import { z } from "zod";

import {
  cleanUrl,
  normalizeText,
  slugify,
  type BusinessType,
  type MicSupplier,
} from "./made-in-china-parser";

const COUNTRY_CODE = "CN";
const MAX_CITY_LENGTH = 30;

const PROVINCES: ReadonlySet<string> = new Set([
  "Anhui", "Beijing", "Chongqing", "Fujian", "Gansu", "Guangdong", "Guangxi", "Guizhou", "Hainan",
  "Hebei", "Heilongjiang", "Henan", "Hubei", "Hunan", "Inner Mongolia", "Jiangsu", "Jiangxi", "Jilin",
  "Liaoning", "Ningxia", "Qinghai", "Shaanxi", "Shandong", "Shanghai", "Shanxi", "Sichuan", "Tianjin",
  "Tibet", "Xinjiang", "Yunnan", "Zhejiang",
]);

const CERTIFICATION_RULES: readonly { readonly code: string; readonly test: RegExp }[] = [
  { code: "ISO9001", test: /ISO\s*9001/i },
  { code: "ISO14001", test: /ISO\s*14001/i },
  { code: "CE", test: /\bCE\b/ },
  { code: "ASTM", test: /\bASTM\b/i },
  { code: "SGS", test: /\bSGS\b/i },
  { code: "BIS", test: /\bBIS\b/ },
];

const text = z.string().nullish();

export const rawSupplierSchema = z.object({
  supplierId: z.string().min(1),
  companyName: z.string().min(1),
  profileUrl: z.string().min(1),
  businessType: text,
  yearEstablished: text,
  managementSystemCertification: text,
  mainProducts: z.array(z.string()).nullish().transform((value) => value ?? []),
  address: text,
  city: text,
  province: text,
  country: text,
  scrapedAt: text,
});

export type RawSupplier = z.infer<typeof rawSupplierSchema>;

export interface Location {
  readonly city: string;
  readonly province: string | null;
}

export function parseSuppliersJson(content: string): RawSupplier[] {
  const data: unknown = JSON.parse(content);
  if (!Array.isArray(data)) throw new Error("El archivo debe ser una lista de proveedores.");
  return data.map((entry, index) => {
    const result = rawSupplierSchema.safeParse(entry);
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new Error(`Proveedor #${index + 1}: ${issue.path.join(".")} ${issue.message}`);
    }
    return result.data;
  });
}

function cleanPlace(value: string | null | undefined): string | null {
  const cleaned = (value ?? "").replace(/\s+/g, " ").replace(/\.$/, "").trim();
  if (cleaned === "" || cleaned === "null") return null;
  return cleaned.replace(/\s+(City|Area)$/i, "");
}

function cleanProvince(value: string | null | undefined): string | null {
  const cleaned = cleanPlace(value)?.replace(/\s+Province$/i, "") ?? null;
  return cleaned !== null && PROVINCES.has(cleaned) ? cleaned : null;
}

function isPlausibleCity(city: string): boolean {
  return (
    city.length <= MAX_CITY_LENGTH &&
    !/\d/.test(city) &&
    !/\b(road|street|zone|district|company|park|floor|building|located)\b/i.test(city)
  );
}

function locationFromAddress(address: string | null | undefined): Location | null {
  const parts = (address ?? "")
    .split(",")
    .map((part) => cleanPlace(part))
    .filter((part): part is string => part !== null);
  if (parts.length > 0 && /^china$/i.test(parts[parts.length - 1])) parts.pop();
  const last = parts[parts.length - 1];
  if (!last) return null;
  const province = cleanProvince(last);
  const city = province ? parts[parts.length - 2] : last;
  return city && isPlausibleCity(city) ? { city, province } : null;
}

/** Ciudad y provincia: corrección curada, campos del sitio y, si no sirven, la dirección. */
export function resolveLocation(
  raw: RawSupplier,
  overrides: Readonly<Record<string, Location>>,
): Location | null {
  const override = overrides[raw.supplierId];
  if (override) return override;
  const city = cleanPlace(raw.city);
  if (city && isPlausibleCity(city)) return { city, province: cleanProvince(raw.province) };
  return locationFromAddress(raw.address);
}

export function mapBusinessType(value: string | null | undefined): BusinessType | null {
  const lower = (value ?? "").toLowerCase();
  if (lower.includes("manufacturer")) return "manufacturer";
  if (lower.includes("trading")) return "trading_company";
  return null;
}

export function inferBusinessTypeFromText(content: string): BusinessType | null {
  if (/\b(manufactur\w*|factory|production (base|line)s?|workshop|our plant)\b/i.test(content)) {
    return "manufacturer";
  }
  if (/\b(trading|exporter|export (of|company)|sourcing|distributor|wholesale)\b/i.test(content)) {
    return "trading_company";
  }
  return null;
}

export function certificationCodes(value: string | null | undefined): string[] {
  const source = value ?? "";
  return CERTIFICATION_RULES.filter((rule) => rule.test.test(source)).map((rule) => rule.code);
}

export function parseEstablishedYear(value: string | null | undefined): number | null {
  const match = /^(\d{4})/.exec((value ?? "").trim());
  const year = match ? Number(match[1]) : NaN;
  return year >= 1900 && year <= 2100 ? year : null;
}

export interface SupplierContext {
  readonly locationOverrides: Readonly<Record<string, Location>>;
  /** Texto del perfil del proveedor, solo para inferir el tipo cuando el sitio no lo dice. */
  readonly profileText: string | null;
}

export type TypeSource = "site" | "profile" | "assumed";

export type SupplierOutcome =
  | { readonly ok: true; readonly supplier: MicSupplier; readonly typeSource: TypeSource }
  | { readonly ok: false; readonly reason: string };

function resolveBusinessType(
  raw: RawSupplier,
  profileText: string | null,
): { type: BusinessType; source: TypeSource } {
  const fromSite = mapBusinessType(raw.businessType);
  if (fromSite) return { type: fromSite, source: "site" };
  const fromProfile = profileText ? inferBusinessTypeFromText(profileText) : null;
  if (fromProfile) return { type: fromProfile, source: "profile" };
  // Sin evidencia se asume la opción que no afirma que fabrican.
  return { type: "trading_company", source: "assumed" };
}

function describe(name: string, type: BusinessType, place: string, products: readonly string[]) {
  const manufacturer = type === "manufacturer";
  const kindEn = manufacturer ? "a manufacturer" : "a trading company";
  const kindEs = manufacturer ? "un fabricante" : "una empresa comercializadora";
  const listEn = products.length > 0 ? ` Main products: ${products.join(", ")}.` : "";
  const listEs = products.length > 0 ? ` Productos principales: ${products.join(", ")}.` : "";
  return {
    en: `${name} is ${kindEn} based in ${place}.${listEn} Company profile from Made-in-China.com.`,
    es: `${name} es ${kindEs} con sede en ${place}.${listEs} Perfil de empresa tomado de Made-in-China.com.`,
  };
}

export function buildSupplierFromJson(raw: RawSupplier, context: SupplierContext): SupplierOutcome {
  const location = resolveLocation(raw, context.locationOverrides);
  if (!location) return { ok: false, reason: "no se pudo determinar la ciudad del proveedor" };
  const name = normalizeText(raw.companyName);
  const { type, source } = resolveBusinessType(raw, context.profileText);
  const place = [location.city, location.province, "China"].filter((part) => part !== null).join(", ");
  const description = describe(name, type, place, raw.mainProducts.map(normalizeText));
  return {
    ok: true,
    typeSource: source,
    supplier: {
      slug: slugify(name),
      name,
      countryCode: COUNTRY_CODE,
      city: location.city,
      foundedYear: parseEstablishedYear(raw.yearEstablished),
      businessType: type,
      certifications: certificationCodes(raw.managementSystemCertification),
      descriptionEn: description.en,
      descriptionEs: description.es,
      sourceUrl: cleanUrl(raw.profileUrl),
      externalId: raw.supplierId,
      scrapedAt: raw.scrapedAt ?? new Date().toISOString(),
    },
  };
}
