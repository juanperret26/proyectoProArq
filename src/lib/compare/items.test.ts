import { describe, expect, it } from "vitest";

import {
  MAX_COMPARE_ITEMS,
  addCompareItem,
  parseCompareIds,
  parseStoredItems,
  removeCompareItem,
  toCompareHref,
} from "./items";

const ID_A = "04978c1c-1b48-403a-a5c0-3045a6323054";
const ID_B = "0fdb138b-75aa-4f8f-85e4-b3b99eba1a9c";
const ID_C = "11111111-1111-4111-8111-111111111111";
const ID_D = "22222222-2222-4222-8222-222222222222";
const ID_E = "33333333-3333-4333-8333-333333333333";

const item = (id: string) => ({ id, name: `Product ${id.slice(0, 4)}` });

describe("parseCompareIds", () => {
  it("reads a comma-separated list", () => {
    expect(parseCompareIds(`${ID_A},${ID_B}`)).toEqual([ID_A, ID_B]);
  });

  it("returns an empty list when the param is missing", () => {
    expect(parseCompareIds(undefined)).toEqual([]);
  });

  it("drops invalid ids and duplicates", () => {
    expect(parseCompareIds(`${ID_A},nope,${ID_A},'; drop`)).toEqual([ID_A]);
  });

  it("keeps at most the maximum number of ids", () => {
    const all = [ID_A, ID_B, ID_C, ID_D, ID_E].join(",");
    expect(parseCompareIds(all)).toHaveLength(MAX_COMPARE_ITEMS);
  });

  it("uses the first value when the param is repeated", () => {
    expect(parseCompareIds([ID_A, ID_B])).toEqual([ID_A]);
  });
});

describe("addCompareItem", () => {
  it("adds a new item at the end without mutating the list", () => {
    const original = [item(ID_A)];
    const next = addCompareItem(original, item(ID_B));
    expect(next.map((i) => i.id)).toEqual([ID_A, ID_B]);
    expect(original).toHaveLength(1);
  });

  it("ignores an item already in the list", () => {
    const original = [item(ID_A)];
    expect(addCompareItem(original, item(ID_A))).toBe(original);
  });

  it("refuses to go over the limit", () => {
    const full = [ID_A, ID_B, ID_C, ID_D].map(item);
    expect(addCompareItem(full, item(ID_E))).toBe(full);
  });
});

describe("removeCompareItem", () => {
  it("removes by id and keeps the order of the rest", () => {
    const list = [ID_A, ID_B, ID_C].map(item);
    expect(removeCompareItem(list, ID_B).map((i) => i.id)).toEqual([ID_A, ID_C]);
  });
});

describe("toCompareHref", () => {
  it("builds the shareable compare URL", () => {
    expect(toCompareHref([ID_A, ID_B])).toBe(`/compare?ids=${ID_A},${ID_B}`);
  });

  it("links to the bare page when there are no ids", () => {
    expect(toCompareHref([])).toBe("/compare");
  });
});

describe("parseStoredItems", () => {
  it("restores a valid stored list", () => {
    const stored = JSON.stringify([item(ID_A), item(ID_B)]);
    expect(parseStoredItems(stored)).toEqual([item(ID_A), item(ID_B)]);
  });

  it("returns an empty list for null, bad JSON or a wrong shape", () => {
    expect(parseStoredItems(null)).toEqual([]);
    expect(parseStoredItems("{not json")).toEqual([]);
    expect(parseStoredItems(JSON.stringify({ id: ID_A }))).toEqual([]);
    expect(parseStoredItems(JSON.stringify([{ id: 5, name: "x" }]))).toEqual([]);
  });

  it("drops repeated ids", () => {
    const stored = JSON.stringify([item(ID_A), item(ID_A), item(ID_B)]);
    expect(parseStoredItems(stored).map((i) => i.id)).toEqual([ID_A, ID_B]);
  });

  it("drops invalid ids and truncates to the limit", () => {
    const stored = JSON.stringify([
      item(ID_A),
      { id: "bad", name: "Bad" },
      item(ID_B),
      item(ID_C),
      item(ID_D),
      item(ID_E),
    ]);
    const restored = parseStoredItems(stored);
    expect(restored.map((i) => i.id)).toEqual([ID_A, ID_B, ID_C, ID_D]);
  });
});
