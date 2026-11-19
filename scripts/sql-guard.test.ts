import { describe, expect, it } from "vitest";

import { assertInsertOnlySql } from "./sql-guard";

describe("assertInsertOnlySql", () => {
  it("acepta inserciones y actualizaciones", () => {
    expect(() =>
      assertInsertOnlySql("insert into public.suppliers (slug) values ('a') on conflict do nothing;"),
    ).not.toThrow();
    expect(() => assertInsertOnlySql("update public.products p set image_urls = v.i from (values (1)) v;")).not.toThrow();
  });

  it("ignora palabras peligrosas dentro de textos entre comillas y comentarios", () => {
    const sql = "-- no hace drop table\ninsert into t (d) values ('delete it, drop it, alter it, it''s fine');";

    expect(() => assertInsertOnlySql(sql)).not.toThrow();
  });

  it("rechaza sentencias destructivas o de permisos", () => {
    for (const bad of [
      "drop table public.products;",
      "delete from public.products;",
      "truncate public.suppliers;",
      "alter table public.products add column x int;",
      "grant all on public.products to anon;",
      "insert into t values (1); DELETE FROM t;",
    ]) {
      expect(() => assertInsertOnlySql(bad)).toThrow(/permitid/i);
    }
  });
});
