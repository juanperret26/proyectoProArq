import { describe, expect, it } from "vitest";

import { renderNamesEsSql } from "./made-in-china-names";

describe("renderNamesEsSql", () => {
  const sqlText = renderNamesEsSql({ AAA: "Encofrado de aluminio", BBB: "Panel d'obra", CCC: "  " });

  it("actualiza solo los nombres en español que aún faltan, de forma repetible", () => {
    expect(sqlText).toContain("update public.products p");
    expect(sqlText).toContain("set name_es = v.name_es");
    expect(sqlText).toContain("p.name_es is null");
    expect(sqlText).toContain("p.source_site = 'made-in-china'");
  });

  it("escapa las comillas y omite las traducciones vacías", () => {
    expect(sqlText).toContain("('BBB', 'Panel d''obra')");
    expect(sqlText).toContain("('AAA', 'Encofrado de aluminio')");
    expect(sqlText).not.toContain("'CCC'");
  });

  it("no genera nada si no hay traducciones", () => {
    expect(renderNamesEsSql({})).toBe("");
  });
});
