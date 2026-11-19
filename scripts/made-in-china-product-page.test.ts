import { describe, expect, it } from "vitest";

import {
  extractHomeProductUrls,
  parseProductPage,
  type ScrapedProductPage,
} from "./made-in-china-product-page";

const HOST = "https://acme.en.made-in-china.com";
const URL = `${HOST}/product/AGyUbsfCCFrR/China-Aluminum-Formwork.html`;

function ldJson(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

const PRODUCT_LD = ldJson({
  "@type": "Product",
  name: "Aluminum Formwork Panel",
  description: "Reusable panels. Fast assembly.",
  image: ["https://image.made-in-china.com/2f0j00AAA/Panel.webp"],
  additionalProperty: [
    { "@type": "PropertyValue", name: "Model NO.", value: "6061-T6" },
    { "@type": "PropertyValue", name: "Material", value: "Aluminum Alloy" },
    { "@type": "PropertyValue", name: "Warranty", value: "1 year" },
    { "@type": "PropertyValue", name: "Surface Finishing", value: "Mill finish" },
  ],
  offers: { "@type": "Offer", priceCurrency: "USD", price: "102.00" },
});

const BREADCRUMB = ldJson({
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home" },
    { "@type": "ListItem", position: 2, name: "Construction & Decoration" },
    { "@type": "ListItem", position: 3, name: "Aluminum Profile" },
    { "@type": "ListItem", position: 4, name: "Aluminum Formwork Panel" },
  ],
});

const GALLERY = `<img class="J-picImg-zoom-in" data-index="1" src="//image.made-in-china.com/202f0j00AAA/Panel.webp"><a href="//image.made-in-china.com/203f0j00AAA/Panel.webp"></a>`;

function tier(price: string, range: string, unit: string): string {
  return `<li class="swiper-slide-div swiper-slide"><span class="swiper-money-container">US$${price}</span> <div class="swiper-unit-container">${range} <span class="unit">${unit}</span></div></li>`;
}

const TIERED = [
  tier("118.00", "50-99", "Pieces"),
  tier("113.00", "100-499", "Pieces"),
  tier("1,102.00", "5,000+", "Pieces"),
].join("");

const RANGE = `<span class="only-one-priceNum-td-left">US$4.30-5.20 </span> <span class="sa-only-property-price only-one-priceNum-price">350 Square Meters(MOQ)</span>`;

function page(parts: string[]): string {
  return `<html><body>${parts.join("\n")}</body></html>`;
}

function parsed(parts: string[]): ScrapedProductPage {
  const result = parseProductPage(page(parts), URL);
  if (!result) throw new Error("la ficha debería parsearse");
  return result;
}

describe("parseProductPage", () => {
  it("lee nombre, descripción, rubro y fotos ampliadas", () => {
    const product = parsed([PRODUCT_LD, BREADCRUMB, GALLERY, TIERED]);

    expect(product).toMatchObject({
      externalId: "AGyUbsfCCFrR",
      name: "Aluminum Formwork Panel",
      description: "Reusable panels. Fast assembly.",
      categoryPath: ["Construction & Decoration", "Aluminum Profile"],
      imageUrls: ["https://image.made-in-china.com/203f0j00AAA/Panel.webp"],
      sourceUrl: URL,
    });
  });

  it("usa las fotos del bloque estructurado si no hay galería", () => {
    expect(parsed([PRODUCT_LD, TIERED]).imageUrls).toEqual([
      "https://image.made-in-china.com/2f0j00AAA/Panel.webp",
    ]);
  });

  it("lee los tramos escalonados con su unidad y cantidad mínima", () => {
    const product = parsed([PRODUCT_LD, TIERED]);

    expect(product.price).toEqual({
      tiers: [
        { minQty: 50, unitPrice: 118 },
        { minQty: 100, unitPrice: 113 },
        { minQty: 5000, unitPrice: 1102 },
      ],
      minOrderQty: 50,
      unit: "piece",
      lowestPrice: 113,
    });
  });

  it("lee también los tramos cuando el precio va en un div en vez de un span", () => {
    const divTier = `<div class="swiper-slide-div"><div class="swiper-money-container">US$118.00</div> <div class="swiper-unit-container">50-99 <span class="unit">Pieces</span></div></div>`;

    expect(parsed([PRODUCT_LD, divTier]).price).toMatchObject({
      tiers: [{ minQty: 50, unitPrice: 118 }],
      unit: "piece",
    });
  });

  it("lee un precio con rango y pedido mínimo como un único tramo", () => {
    const product = parsed([PRODUCT_LD, RANGE]);

    expect(product.price).toEqual({
      tiers: [{ minQty: 350, unitPrice: 5.2 }],
      minOrderQty: 350,
      unit: "m2",
      lowestPrice: 4.3,
    });
  });

  it("deja el precio en null si la ficha no muestra uno numérico", () => {
    expect(parsed([PRODUCT_LD]).price).toBeNull();
  });

  it("marca la unidad como desconocida en vez de inventarla", () => {
    const product = parsed([PRODUCT_LD, tier("5.00", "10-99", "Containers")]);

    expect(product.price).toBeNull();
    expect(product.priceIssue).toMatch(/unidad/i);
  });

  it("filtra las especificaciones de relleno y deja las útiles", () => {
    expect(parsed([PRODUCT_LD, TIERED]).specs).toEqual([
      { label: "Material", value: "Aluminum Alloy" },
      { label: "Surface Finishing", value: "Mill finish" },
    ]);
  });

  it("lee el plazo de entrega en días cuando existe", () => {
    const withLead = parsed([PRODUCT_LD, TIERED, "<div>Lead Time</div> <div>30 days (1 - 25 Pieces)</div>"]);

    expect(withLead.leadTimeDays).toBe(30);
    expect(parsed([PRODUCT_LD, TIERED]).leadTimeDays).toBeNull();
  });

  it("devuelve null si la página no es una ficha de producto", () => {
    expect(parseProductPage(page([BREADCRUMB]), URL)).toBeNull();
  });
});

describe("extractHomeProductUrls", () => {
  const link = (id: string, host = "acme.en.made-in-china.com") =>
    `<a href="//${host}/product/${id}/China-Item-${id}.html">x</a>`;

  it("devuelve las fichas del propio proveedor, en orden, sin repetir", () => {
    const html = [link("AAAAAAAAAAAA"), link("BBBBBBBBBBBB"), link("AAAAAAAAAAAA"), link("CCCCCCCCCCCC")].join("");

    expect(extractHomeProductUrls(html, "acme.en.made-in-china.com", 2)).toEqual([
      `${HOST}/product/AAAAAAAAAAAA/China-Item-AAAAAAAAAAAA.html`,
      `${HOST}/product/BBBBBBBBBBBB/China-Item-BBBBBBBBBBBB.html`,
    ]);
  });

  it("ignora fichas de otros proveedores", () => {
    const html = link("AAAAAAAAAAAA", "other.en.made-in-china.com") + link("BBBBBBBBBBBB");

    expect(extractHomeProductUrls(html, "acme.en.made-in-china.com", 5)).toHaveLength(1);
  });

  it("descarta enlaces con query", () => {
    const html = `<a href="https://acme.en.made-in-china.com/product/AAAAAAAAAAAA/China-X.html?ads=1">x</a>`;

    expect(extractHomeProductUrls(html, "acme.en.made-in-china.com", 5)).toEqual([
      `${HOST}/product/AAAAAAAAAAAA/China-X.html`,
    ]);
  });
});
