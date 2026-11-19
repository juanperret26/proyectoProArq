import { describe, expect, it } from "vitest";

import {
  buildSupplierFromJson,
  certificationCodes,
  inferBusinessTypeFromText,
  mapBusinessType,
  parseEstablishedYear,
  parseSuppliersJson,
  resolveLocation,
  type RawSupplier,
} from "./made-in-china-suppliers";

function raw(overrides: Partial<RawSupplier> = {}): RawSupplier {
  return {
    supplierId: "acme",
    companyName: "Acme Formwork Co., Ltd.",
    profileUrl: "https://acme.en.made-in-china.com/",
    businessType: "Manufacturer/Factory & Trading Company",
    yearEstablished: "2014",
    managementSystemCertification: "ISO9001:2015, ISO45001:2018, ISO14001",
    mainProducts: ["Aluminum Formwork", "Scaffolding"],
    address: "No. 1 Road, Shangqiu, Henan, China",
    city: "Shangqiu",
    province: "Henan",
    country: "China",
    scrapedAt: "2026-11-19T20:32:46.599Z",
    ...overrides,
  };
}

describe("parseSuppliersJson", () => {
  it("valida cada proveedor y conserva los campos que usamos", () => {
    const parsed = parseSuppliersJson(JSON.stringify([raw(), { ...raw(), supplierId: "b" }]));

    expect(parsed).toHaveLength(2);
    expect(parsed[0].companyName).toBe("Acme Formwork Co., Ltd.");
  });

  it("acepta campos nulos o ausentes", () => {
    const sparse = { supplierId: "x", companyName: "X Co", profileUrl: "https://x.en.made-in-china.com/", city: null };

    expect(parseSuppliersJson(JSON.stringify([sparse]))[0].mainProducts).toEqual([]);
  });

  it("falla indicando la posición si falta un campo obligatorio", () => {
    expect(() => parseSuppliersJson(JSON.stringify([raw(), { supplierId: "x" }]))).toThrow(/#2/);
  });

  it("falla si el archivo no es una lista", () => {
    expect(() => parseSuppliersJson("{}")).toThrow(/lista/);
  });
});

describe("resolveLocation", () => {
  it("usa ciudad y provincia del registro cuando son válidas", () => {
    expect(resolveLocation(raw(), {})).toEqual({ city: "Shangqiu", province: "Henan" });
  });

  it("quita sufijos como City y Province", () => {
    expect(resolveLocation(raw({ city: "Jiangyin City", province: "Henan Province" }), {})).toEqual({
      city: "Jiangyin",
      province: "Henan",
    });
  });

  it("acepta ciudades sin provincia (municipios como Tianjin)", () => {
    expect(resolveLocation(raw({ city: "Tianjin", province: null, address: "Tianjin, China" }), {})).toEqual({
      city: "Tianjin",
      province: null,
    });
  });

  it("recupera la ciudad desde la dirección si el campo trae una calle", () => {
    const record = raw({
      city: "39 Donghaixi Road",
      province: "Qingdao",
      address: "39 Donghaixi Road, Qingdao,China.",
    });

    expect(resolveLocation(record, {})).toEqual({ city: "Qingdao", province: null });
  });

  it("prefiere la corrección curada del proveedor", () => {
    const record = raw({ city: null, province: null, address: "Zhenzhou Henan" });

    expect(resolveLocation(record, { acme: { city: "Zhengzhou", province: "Henan" } })).toEqual({
      city: "Zhengzhou",
      province: "Henan",
    });
  });

  it("devuelve null si no hay forma de saber la ciudad", () => {
    expect(resolveLocation(raw({ city: null, province: null, address: null }), {})).toBeNull();
  });
});

describe("tipo de empresa", () => {
  it("traduce el texto del sitio", () => {
    expect(mapBusinessType("Manufacturer/Factory & Trading Company")).toBe("manufacturer");
    expect(mapBusinessType("Manufacturer/Factory")).toBe("manufacturer");
    expect(mapBusinessType("Trading Company")).toBe("trading_company");
    expect(mapBusinessType(null)).toBeNull();
    expect(mapBusinessType("Group Corporation")).toBeNull();
  });

  it("infiere desde el texto del perfil cuando el campo falta", () => {
    expect(inferBusinessTypeFromText("We own a factory with 5 production lines")).toBe("manufacturer");
    expect(inferBusinessTypeFromText("A trading company exporting steel")).toBe("trading_company");
    expect(inferBusinessTypeFromText("Welcome to our page")).toBeNull();
  });
});

describe("certificaciones y año", () => {
  it("reconoce solo las certificaciones que existen en el catálogo", () => {
    expect(certificationCodes("ISO9001:2015, ISO45001:2018, ISO 14001, CE")).toEqual([
      "ISO9001",
      "ISO14001",
      "CE",
    ]);
    expect(certificationCodes(null)).toEqual([]);
  });

  it("lee el año de fundación con o sin fecha completa", () => {
    expect(parseEstablishedYear("2014")).toBe(2014);
    expect(parseEstablishedYear("2025-07-25")).toBe(2025);
    expect(parseEstablishedYear("1800")).toBeNull();
    expect(parseEstablishedYear(null)).toBeNull();
  });
});

describe("buildSupplierFromJson", () => {
  it("arma el proveedor con ubicación, tipo, certificaciones y descripción", () => {
    const outcome = buildSupplierFromJson(raw(), { locationOverrides: {}, profileText: null });

    expect(outcome).toMatchObject({
      ok: true,
      supplier: {
        slug: "acme-formwork-co-ltd",
        countryCode: "CN",
        city: "Shangqiu",
        foundedYear: 2014,
        businessType: "manufacturer",
        certifications: ["ISO9001", "ISO14001"],
        sourceUrl: "https://acme.en.made-in-china.com/",
        externalId: "acme",
        scrapedAt: "2026-11-19T20:32:46.599Z",
      },
    });
    if (outcome.ok) {
      expect(outcome.supplier.descriptionEn).toContain("manufacturer based in Shangqiu, Henan, China");
      expect(outcome.supplier.descriptionEn).toContain("Aluminum Formwork, Scaffolding");
      expect(outcome.supplier.descriptionEs).toContain("Productos principales");
    }
  });

  it("usa el perfil para inferir el tipo y avisa cuando hubo que suponerlo", () => {
    const record = raw({ businessType: null });

    const inferred = buildSupplierFromJson(record, { locationOverrides: {}, profileText: "our factory and workshop" });
    const guessed = buildSupplierFromJson(record, { locationOverrides: {}, profileText: null });

    expect(inferred).toMatchObject({ ok: true, supplier: { businessType: "manufacturer" }, typeSource: "profile" });
    expect(guessed).toMatchObject({ ok: true, supplier: { businessType: "trading_company" }, typeSource: "assumed" });
  });

  it("omite al proveedor sin ciudad conocida y dice por qué", () => {
    const outcome = buildSupplierFromJson(raw({ city: null, province: null, address: null }), {
      locationOverrides: {},
      profileText: null,
    });

    expect(outcome).toEqual({ ok: false, reason: expect.stringContaining("ciudad") });
  });
});
