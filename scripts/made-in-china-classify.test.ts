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

  it("clasifica maquinaria aunque el nombre mencione un material", () => {
    expect(classify("Tower Crane QTZ80")).toBe("cranes");
    expect(classify("Forklift Truck 3 Ton")).toBe("forklifts");
    expect(classify("Formwork Bending Machine")).toBe("building-material-machines");
    expect(classify("Rotary Drilling Rig")).toBe("drilling-rigs");
    expect(classify("Mobile Concrete Batching Plant")).toBe("concrete-machinery");
    expect(classify("Hydraulic Excavator 20 Ton")).toBe("earthmoving-machinery");
    expect(classify("Construction Elevator SC200")).toBe("lifting-equipment");
    expect(classify("Heavy-Duty Hydraulic Lock Valve")).toBe("machinery-parts");
  });

  it("no confunde el encofrado hidráulico con repuestos hidráulicos", () => {
    expect(classify("Hydraulic Auto-Climbing Formwork")).toBe("scaffolding");
  });

  it("clasifica vehículos y sus repuestos", () => {
    expect(classify("Dump Truck 6x4")).toBe("trucks");
    expect(classify("Truck Trailer 3 Axle")).toBe("trailers");
    expect(classify("Truck Tire 315/80R22.5")).toBe("vehicle-parts");
  });

  it("clasifica edificios prefabricados y estructuras de acero", () => {
    expect(classify("Container House Prefab")).toBe("container-houses");
    expect(classify("Steel Structure Warehouse")).toBe("steel-structure-buildings");
    expect(classify("Prefabricated Villa")).toBe("prefab-houses");
  });

  it("clasifica metales, madera, pinturas y químicos", () => {
    expect(classify("PPGI Prepainted Steel Coil")).toBe("metal-coils-strips");
    expect(classify("PPGI Roofing Sheet")).toBe("roofing-sheets");
    expect(classify("Aluminum Sheet 5052")).toBe("non-ferrous-metals");
    expect(classify("Brass Flat Plate")).toBe("non-ferrous-metals");
    expect(classify("Marine Plywood 18mm")).toBe("timber-plywood");
    expect(classify("Exterior Wall Paint")).toBe("paints-coatings");
    expect(classify("Silicone Sealant")).toBe("adhesives-sealants");
    expect(classify("Sodium Silicate Liquid")).toBe("industrial-chemicals");
  });

  it("clasifica planchas, cercos, cajas de zanja, bombas y cordones de acero", () => {
    expect(classify("Stainless Steel Sheet 304 for Construction")).toBe("metal-coils-strips");
    expect(classify("Hot Rolled Carbon Steel Plates")).toBe("metal-coils-strips");
    expect(classify("Powder Coated Palisade Fence")).toBe("welded-mesh");
    expect(classify("Customizable Heavy-Duty Trench Box")).toBe("scaffolding");
    expect(classify("Self-Priming Diesel Pump 6 Inch")).toBe("machinery-parts");
    expect(classify("High-Strength PC Strand for Prestressed Concrete")).toBe("rebar");
    expect(classify("Mild Steel Channel Bar Black Finish")).toBe("structural-sections");
    expect(classify("ISO2531 Ductile Iron Pipe")).toBe("steel-pipes");
  });

  it("usa el rubro del sitio para ubicar un producto de nombre genérico", () => {
    expect(classify("Premium Item", ["Transportation", "Truck", "Dump Truck"])).toBe("trucks");
    expect(classify("Premium Item", ["Chemicals", "Paint & Coating"])).toBe("paints-coatings");
  });

  it("devuelve null si nada coincide", () => {
    expect(classify("Steam Coal for Power Plant")).toBeNull();
  });

  it("también mira el rubro del sitio cuando el nombre no alcanza", () => {
    expect(classify("Premium Quality Item", ["Building Material", "Scaffolding"])).toBe("scaffolding");
  });
});
