import { describe, expect, it } from "vitest";

import {
  MAX_GALLERY_IMAGES,
  assertProductPageUrl,
  parseGalleryImages,
  renderImagesSql,
} from "./made-in-china-images";

const CDN = "//image.made-in-china.com";

function galleryImg(index: number, id: string, extra = ""): string {
  return `<img class="J-picImg-zoom-in" ads-data="st:239" data-index="${index}" loading="lazy" decoding="async" src="${CDN}/202f0j00${id}/Tile.webp" alt="Tile pictures & photos"${extra}>`;
}

describe("parseGalleryImages", () => {
  it("devuelve las fotos de la galería en orden y con https", () => {
    const html = `<div>${galleryImg(1, "AAA")}${galleryImg(2, "BBB")}</div>`;

    expect(parseGalleryImages(html)).toEqual([
      "https://image.made-in-china.com/202f0j00AAA/Tile.webp",
      "https://image.made-in-china.com/202f0j00BBB/Tile.webp",
    ]);
  });

  it("usa la versión ampliada de cada foto cuando la ficha la ofrece", () => {
    const html = `${galleryImg(1, "AAA")}${galleryImg(2, "BBB")}<a data-big="${CDN}/203f0j00AAA/Tile.webp"></a>`;

    expect(parseGalleryImages(html)).toEqual([
      "https://image.made-in-china.com/203f0j00AAA/Tile.webp",
      "https://image.made-in-china.com/202f0j00BBB/Tile.webp",
    ]);
  });

  it("ordena por data-index aunque aparezcan desordenadas", () => {
    const html = galleryImg(2, "BBB") + galleryImg(1, "AAA");

    expect(parseGalleryImages(html)).toEqual([
      "https://image.made-in-china.com/202f0j00AAA/Tile.webp",
      "https://image.made-in-china.com/202f0j00BBB/Tile.webp",
    ]);
  });

  it("ignora imágenes que no son de la galería (recomendados, empresa)", () => {
    const html = `${galleryImg(1, "AAA")}<img class="other" src="${CDN}/43f34j00ZZZ/Other.webp"><img src="${CDN}/210f0j00CCC/Company.webp">`;

    expect(parseGalleryImages(html)).toHaveLength(1);
  });

  it("quita duplicados y respeta el máximo de fotos", () => {
    const many = Array.from({ length: MAX_GALLERY_IMAGES + 3 }, (_, i) => galleryImg(i + 1, `ID${i}`));

    expect(parseGalleryImages(galleryImg(1, "ID0") + many.join(""))).toHaveLength(MAX_GALLERY_IMAGES);
  });

  it("descarta URLs de otros hosts o con esquema peligroso", () => {
    const html = [
      `<img class="J-picImg-zoom-in" data-index="1" src="https://evil.example.com/x.webp">`,
      `<img class="J-picImg-zoom-in" data-index="2" src="javascript:alert(1)">`,
      `<img class="J-picImg-zoom-in" data-index="3" src="https://image.made-in-china.com.evil.com/x.webp">`,
      galleryImg(4, "OK"),
    ].join("");

    expect(parseGalleryImages(html)).toEqual([
      "https://image.made-in-china.com/202f0j00OK/Tile.webp",
    ]);
  });

  it("devuelve lista vacía si la página no tiene galería", () => {
    expect(parseGalleryImages("<html><body>nada</body></html>")).toEqual([]);
  });
});

describe("assertProductPageUrl", () => {
  it("acepta fichas https de subdominios de made-in-china sin query", () => {
    const url = "https://zenitile.en.made-in-china.com/product/KQZ/China-Tile.html";

    expect(assertProductPageUrl(url)).toBe(url);
  });

  it("rechaza otros hosts, http, rutas ajenas a /product/ y URLs con query", () => {
    expect(() => assertProductPageUrl("https://evil.com/product/x.html")).toThrow(/host/i);
    expect(() => assertProductPageUrl("http://a.en.made-in-china.com/product/x.html")).toThrow(/https/i);
    expect(() => assertProductPageUrl("https://a.en.made-in-china.com/company-x.html")).toThrow(/product/i);
    expect(() => assertProductPageUrl("https://a.en.made-in-china.com/product/x.html?ads_tp=1")).toThrow(
      /query/i,
    );
  });
});

describe("renderImagesSql", () => {
  const sqlText = renderImagesSql([
    { externalId: "p1", imageUrls: ["https://image.made-in-china.com/a'b.webp", "https://image.made-in-china.com/c.webp"] },
    { externalId: "p2", imageUrls: [] },
  ]);

  it("actualiza image_urls de los productos de made-in-china, de forma repetible", () => {
    expect(sqlText).toContain("update public.products");
    expect(sqlText).toContain("set image_urls = v.image_urls");
    expect(sqlText).toContain("p.source_site = 'made-in-china'");
  });

  it("escapa comillas y omite los productos sin fotos", () => {
    expect(sqlText).toContain("a''b.webp");
    expect(sqlText).toContain("('p1'");
    expect(sqlText).not.toContain("('p2'");
  });

  it("no genera nada si no hay fotos que guardar", () => {
    expect(renderImagesSql([{ externalId: "p2", imageUrls: [] }])).toBe("");
  });
});
