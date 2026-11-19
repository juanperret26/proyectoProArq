import { describe, expect, it } from "vitest";

import { classifyProduct } from "./made-in-china-classify";

const classify = (name: string, categoryPath: string[] = []) => classifyProduct({ name, categoryPath });

describe("classifyProduct", () => {
  it("manda encofrados y andamios al rubro de andamios y encofrados", () => {
    expect(classify("Aluminum Alloy Formwork Panel", ["Aluminum Profile"])).toBe("scaffolding");
    expect(classify("Ringlock Scaffolding System")).toBe("scaffolding");
    expect(classify("Adjustable Steel Prop for Slab")).toBe("scaffolding");
  });

  it("distingue los productos de acero", () => {
    expect(classify("HRB400 Deformed Steel Rebar")).toBe("rebar");
    expect(classify("H Beam Q235 Structural Steel")).toBe("structural-sections");
    expect(classify("Seamless Steel Pipe API 5L")).toBe("steel-pipes");
    expect(classify("Welded Wire Mesh for Concrete")).toBe("welded-mesh");
  });

  it("clasifica cemento, morteros y aditivos", () => {
    expect(classify("Portland Cement 42.5")).toBe("portland-cement");
    expect(classify("Ceramic Tile Adhesive Powder")).toBe("mortars-adhesives");
    expect(classify("Polycarboxylate Superplasticizer Admixture")).toBe("concrete-admixtures");
  });

  it("clasifica revestimientos y piedra", () => {
    expect(classify("Glossy Porcelain Floor Tile 600x1200")).toBe("porcelain-tiles");
    expect(classify("Glass Mosaic Tile")).toBe("mosaics");
    expect(classify("Natural Marble Slab")).toBe("stone-slabs");
  });

  it("clasifica aberturas, sanitarios, electricidad y aislación", () => {
    expect(classify("Aluminum Sliding Window")).toBe("aluminum-windows");
    expect(classify("UPVC Casement Window")).toBe("upvc-windows");
    expect(classify("Wall Mounted Toilet")).toBe("toilets");
    expect(classify("LED Panel Light 40W")).toBe("led-lighting");
    expect(classify("Rock Wool Insulation Board")).toBe("mineral-wool");
    expect(classify("Color Coated Roofing Sheet")).toBe("roofing-sheets");
  });

  it("clasifica herramientas y fijaciones", () => {
    expect(classify("Cordless Impact Drill")).toBe("power-tools");
    expect(classify("Hex Bolt and Nut Set")).toBe("fasteners");
  });

  it("descarta maquinaria y vehículos aunque nombren un material", () => {
    expect(classify("Tower Crane QTZ80")).toBeNull();
    expect(classify("Forklift Truck 3 Ton")).toBeNull();
    expect(classify("Formwork Bending Machine")).toBeNull();
    expect(classify("Rotary Drilling Rig")).toBeNull();
  });

  it("devuelve null si nada coincide", () => {
    expect(classify("Steam Coal for Power Plant")).toBeNull();
  });

  it("también mira el rubro del sitio cuando el nombre no alcanza", () => {
    expect(classify("Premium Quality Item", ["Building Material", "Scaffolding"])).toBe("scaffolding");
  });
});
