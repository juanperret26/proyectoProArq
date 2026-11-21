import { describe, expect, it } from "vitest";

import { buildDirectoryGroups } from "./directory-companies";
import { DIRECTORY_COMPANIES, type DirectoryCompany } from "./directory-companies-data";

const HEADER = "pais,empresa,ciudad,productos_o_actividad,fuente\n";

const companies: readonly DirectoryCompany[] = [
  {
    csvName: "Acme Screws",
    activityEn: "Screws",
    activityEs: "Tornillos",
    website: "https://acme.example/",
    fromSite: true,
    products: [{ nameEn: "Drywall screws", nameEs: "Tornillos para yeso", category: "fasteners" }],
  },
  {
    csvName: "Puertas SA",
    cityEn: "Istanbul",
    activityEn: "Doors",
    activityEs: "Puertas",
    website: null,
    fromSite: false,
    products: [{ nameEn: "Doors", nameEs: "Puertas", category: "interior-doors" }],
  },
];

const csv = `${HEADER}Taiwan,Acme Screws,Taichung,Tornillos,Kompass Taiwan\nTurquia,Puertas SA,Estambul,Puertas,Dalil Turkey\n`;

describe("buildDirectoryGroups", () => {
  it("agrupa por directorio de origen y crea proveedores con su país", () => {
    const groups = buildDirectoryGroups(csv, companies);
    expect(groups.map((group) => group.sourceSite)).toEqual(["kompass", "dalil"]);
    expect(groups[0].data.suppliers[0]).toMatchObject({
      slug: "acme-screws",
      countryCode: "TW",
      city: "Taichung",
      sourceUrl: "https://acme.example/",
      businessType: "trading_company",
    });
    expect(groups[1].data.suppliers[0]).toMatchObject({ countryCode: "TR", city: "Istanbul", sourceUrl: null });
  });

  it("carga los productos sin precio, pedido mínimo, plazo ni fotos", () => {
    const [kompass] = buildDirectoryGroups(csv, companies);
    expect(kompass.data.products[0]).toMatchObject({
      externalId: "acme-screws-drywall-screws",
      categorySlug: "fasteners",
      priceFrom: null,
      minOrder: null,
      leadTimeDays: null,
      tiers: [],
      imageUrls: [],
      sourceUrl: "https://acme.example/",
    });
  });

  it("distingue líneas del sitio oficial de actividades del directorio", () => {
    const [kompass, dalil] = buildDirectoryGroups(csv, companies);
    expect(kompass.data.products[0].descriptionEn).toContain("official website");
    expect(dalil.data.products[0].descriptionEn).toContain("Dalil business directory");
  });

  it("falla si el CSV trae una empresa sin datos o falta una del catálogo", () => {
    expect(() => buildDirectoryGroups(`${HEADER}Taiwan,Otra,X,y,Kompass Taiwan\n`, companies)).toThrow(/Otra/);
    expect(() => buildDirectoryGroups(`${HEADER}Taiwan,Acme Screws,X,y,Kompass Taiwan\n`, companies)).toThrow(/Puertas SA/);
  });

  it("falla con un país no soportado", () => {
    expect(() => buildDirectoryGroups(`${HEADER}Peru,Acme Screws,X,y,Z\n`, companies)).toThrow(/País no soportado/);
  });
});

describe("DIRECTORY_COMPANIES", () => {
  it("solo usa rubros que existen en la taxonomía de ProArq", async () => {
    const { CATEGORY_TAXONOMY } = await import("../src/lib/catalog/taxonomy");
    const slugs = new Set(CATEGORY_TAXONOMY.flatMap((c) => [c.slug, ...c.children.map((s) => s.slug)]));
    const unknown = DIRECTORY_COMPANIES.flatMap((c) => c.products.map((p) => p.category)).filter((s) => !slugs.has(s));
    expect(unknown).toEqual([]);
  });

  it("no repite empresas y todo sitio oficial es https", () => {
    const names = DIRECTORY_COMPANIES.map((c) => c.csvName);
    expect(new Set(names).size).toBe(names.length);
    expect(DIRECTORY_COMPANIES.every((c) => c.website === null || c.website.startsWith("https://"))).toBe(true);
  });
});
