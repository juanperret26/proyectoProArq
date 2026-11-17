import { describe, expect, it } from "vitest";

import { bestIndexes } from "./best";

describe("bestIndexes", () => {
  it("finds the lowest value when lower is better", () => {
    expect(bestIndexes([30, 20, 25], "min")).toEqual([1]);
  });

  it("finds the highest value when higher is better", () => {
    expect(bestIndexes([2, 5, 3], "max")).toEqual([1]);
  });

  it("returns every index that ties for best", () => {
    expect(bestIndexes([20, 20, 30], "min")).toEqual([0, 1]);
  });

  it("highlights nothing when all values are equal", () => {
    expect(bestIndexes([10, 10, 10], "min")).toEqual([]);
  });

  it("highlights nothing with fewer than two comparable values", () => {
    expect(bestIndexes([10], "min")).toEqual([]);
    expect(bestIndexes([10, null, null], "min")).toEqual([]);
  });

  it("skips missing values", () => {
    expect(bestIndexes([null, 8, 5], "min")).toEqual([2]);
  });

  it("returns an empty list for an empty input", () => {
    expect(bestIndexes([], "max")).toEqual([]);
  });
});
