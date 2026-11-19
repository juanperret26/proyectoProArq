import { describe, expect, it } from "vitest";

import {
  DEFAULT_LEAD_TIME_DAYS,
  buildMadeInChinaData,
  cleanUrl,
  decodeHtmlEntities,
  parseCsv,
  parseMinOrder,
  parseProperties,
  renderCategoryRealignSql,
  renderMadeInChinaSql,
  scrapedAtFromFileName,
  type BuildOptions,
} from "./made-in-china-parser";

type Row = Record<string, string>;

function row(overrides: Partial<Row> = {}): Row {
  return {
    business_type: "",
    cat_code: "1513020000",
    category: "Floor Tile",
    certifications: "Household, Interior Tiles",
    company_id: "co1",
    company_name: "Foshan Jts Building Materials Co., Ltd.",
    company_url: "https://jts.en.made-in-china.com?ads_tp=ppc&ads_id=abc",
    currency: "US$",
    image_url: "https://image.made-in-china.com/a.webp",
    max_price: "6.90",
    min_order: "500 Square Meters",
    min_price: "5.50",
    product_id: "p1",
    product_name: "Modern Style &amp; Glossy 600X1200mm Porcelain Tile",
    product_url: "https://jts.en.made-in-china.com/product/p1/China-X.html?ads_tp=ppc&header_search_page=lv",
    properties:
      "Material: Porcelain Clay; Type: Full Polished Tiles; After-sales Service: on-Line Service; Warranty: on-Line Service; Size: 600*1200mm",
    ...overrides,
  };
}

const OPTIONS: BuildOptions = {
  scrapedAt: "2026-11-19T12:59:30Z",
  profiles: {
    co1: {
      city: "Foshan",
      businessType: "manufacturer",
      foundedYear: 2014,
      certifications: ["ISO9001"],
    },
    co2: {
      city: "Zibo",
      businessType: "trading_company",
      foundedYear: null,
      certifications: [],
    },
  },
  nameEs: { p1: "Porcelanato brillante 600x1200 mm" },
};

describe("parseCsv", () => {
  it("lee comas dentro de comillas, comillas escapadas y saltos de línea", () => {
    const text = 'a,b,c\r\n"x, y","di ""hola""","l1\nl2"\r\n';

    expect(parseCsv(text)).toEqual([{ a: "x, y", b: 'di "hola"', c: "l1\nl2" }]);
  });

  it("ignora líneas vacías al final y conserva celdas vacías", () => {
    expect(parseCsv('a,b\n"",2\n\n')).toEqual([{ a: "", b: "2" }]);
  });

  it("falla si una fila tiene más celdas que el encabezado", () => {
    expect(() => parseCsv("a,b\n1,2,3\n")).toThrow(/columnas/);
  });
});

describe("helpers de texto", () => {
  it("decodifica entidades HTML comunes y numéricas", () => {
    expect(decodeHtmlEntities("A &amp; B &lt;1&gt; &quot;x&quot; &#39;y&#39; &#x41;")).toBe(
      "A & B <1> \"x\" 'y' A",
    );
  });

  it("quita query y deja la ruta de la URL", () => {
    expect(cleanUrl("https://a.en.made-in-china.com/product/x.html?ads_tp=ppc&y=1")).toBe(
      "https://a.en.made-in-china.com/product/x.html",
    );
    expect(cleanUrl("https://a.en.made-in-china.com?ads_tp=ppc")).toBe(
      "https://a.en.made-in-china.com/",
    );
  });

  it("rechaza URLs que no son http(s)", () => {
    expect(() => cleanUrl("javascript:alert(1)")).toThrow(/http/);
    expect(() => buildMadeInChinaData([row({ image_url: "javascript:x" })], OPTIONS)).toThrow(
      /http/,
    );
  });

  it("toma la fecha de captura del nombre del archivo", () => {
    expect(
      scrapedAtFromFileName("dataset_made-in-china-com-product-scraper_2026-11-19_12-59-30-323.csv"),
    ).toBe("2026-11-19T12:59:30Z");
    expect(scrapedAtFromFileName("otro.csv")).toBeNull();
  });
});

describe("parseProperties", () => {
  it("separa pares etiqueta: valor", () => {
    expect(parseProperties("Material: Porcelain Clay; Size: 600*1200mm")).toEqual([
      { label: "Material", value: "Porcelain Clay" },
      { label: "Size", value: "600*1200mm" },
    ]);
  });

  it("une al valor anterior los fragmentos sin etiqueta", () => {
    expect(parseProperties("Usage: Floor; Wall; Color: Grey")).toEqual([
      { label: "Usage", value: "Floor; Wall" },
      { label: "Color", value: "Grey" },
    ]);
  });

  it("devuelve lista vacía con texto vacío", () => {
    expect(parseProperties("")).toEqual([]);
  });
});

describe("parseMinOrder", () => {
  it("convierte cantidad y unidad a código", () => {
    expect(parseMinOrder("500 Square Meters")).toEqual({ qty: 500, unit: "m2" });
    expect(parseMinOrder("2 Pieces")).toEqual({ qty: 2, unit: "piece" });
    expect(parseMinOrder("1,000 Tons")).toEqual({ qty: 1000, unit: "ton" });
    expect(parseMinOrder("500 pcs")).toEqual({ qty: 500, unit: "piece" });
    expect(parseMinOrder("1,000 kg")).toEqual({ qty: 1000, unit: "kg" });
    expect(parseMinOrder("45 cbm")).toEqual({ qty: 45, unit: "m3" });
    expect(parseMinOrder("1 Unit")).toEqual({ qty: 1, unit: "unit" });
    expect(parseMinOrder("20 Meters")).toEqual({ qty: 20, unit: "m" });
  });

  it("falla con unidad desconocida o cantidad cero", () => {
    expect(() => parseMinOrder("5 Containers")).toThrow(/unidad/i);
    expect(() => parseMinOrder("0 Pieces")).toThrow(/cantidad/i);
    expect(() => parseMinOrder("a lot")).toThrow(/pedido mínimo/);
  });
});

describe("buildMadeInChinaData", () => {
  it("arma proveedores sin duplicar y con los datos curados", () => {
    const { suppliers } = buildMadeInChinaData(
      [row(), row({ product_id: "p2" })],
      OPTIONS,
    );

    expect(suppliers).toHaveLength(1);
    expect(suppliers[0]).toMatchObject({
      slug: "foshan-jts-building-materials-co-ltd",
      name: "Foshan Jts Building Materials Co., Ltd.",
      countryCode: "CN",
      city: "Foshan",
      foundedYear: 2014,
      businessType: "manufacturer",
      certifications: ["ISO9001"],
      sourceUrl: "https://jts.en.made-in-china.com/",
      externalId: "co1",
      scrapedAt: "2026-11-19T12:59:30Z",
    });
    expect(suppliers[0].descriptionEn).toContain("manufacturer based in Foshan, China");
    expect(suppliers[0].descriptionEs).toContain("fabricante con sede en Foshan");
  });

  it("describe como comercializadora al proveedor de tipo trading_company", () => {
    const { suppliers } = buildMadeInChinaData(
      [row({ company_id: "co2", company_name: "Zibo Zenitile Ceramics Co., Limited" })],
      OPTIONS,
    );

    expect(suppliers[0].descriptionEn).toContain("trading company based in Zibo");
    expect(suppliers[0].foundedYear).toBeNull();
  });

  it("mapea el producto: nombre, categoría, unidad, precios y tramo único", () => {
    const { products } = buildMadeInChinaData([row()], OPTIONS);

    expect(products[0]).toMatchObject({
      externalId: "p1",
      supplierExternalId: "co1",
      categorySlug: "porcelain-tiles",
      nameEn: "Modern Style & Glossy 600X1200mm Porcelain Tile",
      nameEs: "Porcelanato brillante 600x1200 mm",
      unit: "m2",
      minOrder: 500,
      leadTimeDays: DEFAULT_LEAD_TIME_DAYS,
      priceFrom: 5.5,
      tiers: [{ minQty: 500, unitPrice: 6.9 }],
      imageUrls: ["https://image.made-in-china.com/a.webp"],
      sourceUrl: "https://jts.en.made-in-china.com/product/p1/China-X.html",
    });
  });

  it("descarta las especificaciones de relleno y traduce las etiquetas", () => {
    const { products } = buildMadeInChinaData([row()], OPTIONS);

    expect(products[0].specs).toEqual([
      { label_en: "Material", label_es: "Material", value: "Porcelain Clay" },
      { label_en: "Type", label_es: "Tipo", value: "Full Polished Tiles" },
      { label_en: "Size", label_es: "Tamaño", value: "600*1200mm" },
    ]);
  });

  it("deja nameEs y descriptionEs en null si no hay traducción", () => {
    const { products } = buildMadeInChinaData([row({ product_id: "p9" })], OPTIONS);

    expect(products[0].nameEs).toBeNull();
    expect(products[0].descriptionEs).toBeNull();
    expect(products[0].descriptionEn).toContain("Minimum order 500 m²");
  });

  it("deja imageUrls vacío cuando la fila no trae imagen", () => {
    const { products } = buildMadeInChinaData([row({ image_url: "" })], OPTIONS);

    expect(products[0].imageUrls).toEqual([]);
  });

  it("falla con categoría desconocida, moneda distinta o precios incoherentes", () => {
    expect(() => buildMadeInChinaData([row({ category: "Gadgets" })], OPTIONS)).toThrow(/categoría/);
    expect(() => buildMadeInChinaData([row({ currency: "EUR" })], OPTIONS)).toThrow(/moneda/i);
    expect(() =>
      buildMadeInChinaData([row({ min_price: "9", max_price: "5" })], OPTIONS),
    ).toThrow(/precio/i);
    expect(() => buildMadeInChinaData([row({ min_price: "0" })], OPTIONS)).toThrow(/precio/i);
    expect(() => buildMadeInChinaData([row({ max_price: "Infinity" })], OPTIONS)).toThrow(
      /precio/i,
    );
  });

  it("falla si falta el perfil curado del proveedor", () => {
    expect(() => buildMadeInChinaData([row({ company_id: "desconocido" })], OPTIONS)).toThrow(
      /perfil/,
    );
  });

  it("falla si una columna obligatoria viene vacía", () => {
    expect(() => buildMadeInChinaData([row({ product_id: "" })], OPTIONS)).toThrow(/product_id/);
  });

  it("falla si dos empresas distintas dan el mismo slug", () => {
    const options: BuildOptions = {
      ...OPTIONS,
      profiles: { ...OPTIONS.profiles, co3: OPTIONS.profiles.co1 },
    };

    expect(() =>
      buildMadeInChinaData([row(), row({ company_id: "co3", product_id: "p3" })], options),
    ).toThrow(/slug/);
  });
});

describe("renderCategoryRealignSql", () => {
  const { products } = buildMadeInChinaData([row()], OPTIONS);

  it("mueve de rubro solo los productos cuyo rubro cambió", () => {
    const sqlText = renderCategoryRealignSql(products);

    expect(sqlText).toContain("update public.products p");
    expect(sqlText).toContain("set category_id = c.id");
    expect(sqlText).toContain("('p1', 'porcelain-tiles')");
    expect(sqlText).toContain("p.category_id <> c.id");
    expect(sqlText).not.toMatch(/\bdelete\b/i);
  });

  it("no genera nada sin productos", () => {
    expect(renderCategoryRealignSql([])).toBe("");
  });
});

describe("renderMadeInChinaSql", () => {
  const sqlText = renderMadeInChinaSql(
    buildMadeInChinaData(
      [row({ product_name: "Tile with 'quotes'" })],
      OPTIONS,
    ),
  );

  it("inserta proveedores, certificaciones, productos y tramos de forma repetible", () => {
    expect(sqlText).toContain("insert into public.suppliers");
    expect(sqlText).toContain("insert into public.supplier_certifications");
    expect(sqlText).toContain("insert into public.products");
    expect(sqlText).toContain("insert into public.price_tiers");
    expect(sqlText).toContain("on conflict do nothing");
    expect(sqlText).toContain("'made-in-china'");
  });

  it("escapa las comillas simples y no borra datos", () => {
    expect(sqlText).toContain("Tile with ''quotes''");
    expect(sqlText).not.toMatch(/\bdelete\b/i);
  });

  it("documenta los supuestos en el encabezado", () => {
    expect(sqlText).toContain("lead_time_days");
    expect(sqlText).toContain("is_verified = false");
  });

  it("usa el encabezado indicado en lugar del predeterminado", () => {
    const custom = renderMadeInChinaSql(buildMadeInChinaData([row()], OPTIONS), "-- encabezado propio");

    expect(custom.startsWith("-- encabezado propio")).toBe(true);
    expect(custom).not.toContain("is_verified = false");
  });

  it("no genera sentencias vacías sin certificaciones", () => {
    const noCerts = renderMadeInChinaSql(
      buildMadeInChinaData([row({ company_id: "co2", company_name: "Zibo Z" })], OPTIONS),
    );

    expect(noCerts).not.toContain("insert into public.supplier_certifications");
  });
});
