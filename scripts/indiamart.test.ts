import { describe, expect, it } from "vitest";

import { buildIndiaMartData, parseInrPrice, parseIndiaMartRows } from "./indiamart";

const row = {
  productName: "Cuplock Scaffolding Standard",
  companyName: "Acme Scaffolds",
  supplierCity: "Mumbai",
  supplierState: "Maharashtra",
  price: "₹ 66/Kg",
  moq: "100 Kg",
  productUrl: "https://www.indiamart.com/proddetail/2851085273655.html",
  supplierUrl: "https://www.indiamart.com/acme-scaffolds/",
  imageUrl: "http://5.imimg.com/data5/SELLER/Default/2023/6/1/a/b/c/77/cup-250x250.jpg",
  businessType: "Manufacturer",
  yearEstablished: "1998",
  specifications: ["Material: Mild Steel", "Color: Blue"],
  scrapedAt: "2026-11-20T23:40:13.433Z",
  supplierId: "77",
  categoryName: "cuplock-scaffolding",
  searchQuery: "scaffolding",
};

const NAMES = { "2851085273655": "Estándar de andamio Cuplock" };
const options = { nameEs: NAMES };

describe("parseInrPrice", () => {
  it("lee precio y unidad", () => {
    expect(parseInrPrice("₹ 150/Kg")).toEqual({ inr: 150, unit: "Kg" });
    expect(parseInrPrice("₹ 1,500/Meter")).toEqual({ inr: 1500, unit: "Meter" });
  });
  it("expande lakh y crore", () => {
    expect(parseInrPrice("₹ 23.10 Lakh/Piece")).toEqual({ inr: 2_310_000, unit: "Piece" });
    expect(parseInrPrice("₹ 1.5 Crore/Unit")).toEqual({ inr: 15_000_000, unit: "Unit" });
  });
  it("devuelve null sin precio utilizable", () => {
    expect(parseInrPrice("₹ 0.00")).toBeNull();
    expect(parseInrPrice("Ask Price")).toBeNull();
    expect(parseInrPrice(null)).toBeNull();
  });
});

describe("buildIndiaMartData", () => {
  it("arma proveedor y producto con precio en USD", () => {
    const { suppliers, products, omitted } = buildIndiaMartData([row], options);
    expect(omitted).toEqual([]);
    expect(suppliers).toHaveLength(1);
    expect(suppliers[0]).toMatchObject({
      slug: "acme-scaffolds",
      countryCode: "IN",
      city: "Mumbai",
      businessType: "manufacturer",
      foundedYear: 1998,
      externalId: "77",
      sourceUrl: "https://www.indiamart.com/acme-scaffolds/",
    });
    expect(products[0]).toMatchObject({
      externalId: "2851085273655",
      supplierExternalId: "77",
      categorySlug: "scaffolding",
      unit: "kg",
      minOrder: 100,
      nameEs: "Estándar de andamio Cuplock",
    });
    expect(products[0].priceFrom).toBeCloseTo(66 * 0.0112, 4);
    expect(products[0].tiers).toEqual([{ minQty: 100, unitPrice: products[0].priceFrom }]);
  });

  it("pasa la foto a https y a mayor tamaño", () => {
    const { products } = buildIndiaMartData([row], options);
    expect(products[0].imageUrls).toEqual([
      "https://5.imimg.com/data5/SELLER/Default/2023/6/1/a/b/c/77/cup-500x500.jpg",
    ]);
  });

  it("convierte pies cuadrados a metros cuadrados", () => {
    const sqft = { ...row, price: "₹ 260/Square Feet", moq: "100 Square feet" };
    const { products } = buildIndiaMartData([sqft], options);
    expect(products[0].unit).toBe("m2");
    expect(products[0].minOrder).toBeCloseTo(9.2903, 3);
    expect(products[0].priceFrom).toBeCloseTo(260 * 10.7639 * 0.0112, 3);
  });

  it("agrupa proveedores y trata revendedores como comercializadoras", () => {
    const other = { ...row, productUrl: "https://www.indiamart.com/proddetail/1.html", businessType: null };
    const { suppliers, products } = buildIndiaMartData([row, other], { nameEs: { ...NAMES, "1": "Otro" } });
    expect(suppliers).toHaveLength(1);
    expect(products).toHaveLength(2);
    const wholesaler = buildIndiaMartData([{ ...row, businessType: "Wholesaler" }], options);
    expect(wholesaler.suppliers[0].businessType).toBe("trading_company");
  });

  it("omite y explica productos sin precio, sin rubro, repetidos o sin traducción", () => {
    const noPrice = { ...row, productUrl: "https://www.indiamart.com/proddetail/2.html", price: "₹ 0.00" };
    const noCategory = {
      ...row,
      productUrl: "https://www.indiamart.com/proddetail/3.html",
      productName: "Zzz",
      categoryName: "zzz",
      searchQuery: "zzz",
    };
    const { products, omitted } = buildIndiaMartData([row, row, noPrice, noCategory], {
      nameEs: { ...NAMES, "2": "x", "3": "y" },
    });
    expect(products).toHaveLength(1);
    expect(omitted.map((o) => o.reason).sort()).toEqual(["fuera de rubro", "repetido", "sin precio"]);
  });

  it("rechaza URLs que no sean de IndiaMART", () => {
    expect(() => buildIndiaMartData([{ ...row, supplierUrl: "javascript:alert(1)" }], options)).toThrow();
    expect(() =>
      buildIndiaMartData([{ ...row, productUrl: "https://evil.example/proddetail/9.html" }], options),
    ).toThrow();
  });
});

describe("parseIndiaMartRows", () => {
  it("exige una lista", () => {
    expect(() => parseIndiaMartRows("{}")).toThrow(/lista/);
  });
});
