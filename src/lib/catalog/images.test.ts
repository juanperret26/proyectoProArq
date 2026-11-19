import { describe, expect, it } from "vitest";

import { IMAGE_HOSTS, displayableImages } from "./images";

describe("displayableImages", () => {
  it("conserva las URLs https de hosts permitidos, en orden", () => {
    const urls = [
      "https://image.made-in-china.com/a.webp",
      "https://image.made-in-china.com/b.webp",
    ];

    expect(displayableImages(urls)).toEqual(urls);
  });

  it("descarta hosts no permitidos, http, esquemas peligrosos y texto inválido", () => {
    expect(
      displayableImages([
        "https://otro.example.com/a.webp",
        "http://image.made-in-china.com/a.webp",
        "javascript:alert(1)",
        "no es una url",
        "",
        "https://image.made-in-china.com.evil.com/a.webp",
      ]),
    ).toEqual([]);
  });

  it("devuelve lista vacía sin fotos", () => {
    expect(displayableImages([])).toEqual([]);
  });

  it("expone los hosts permitidos para configurar next/image", () => {
    expect(IMAGE_HOSTS).toContain("image.made-in-china.com");
  });
});
