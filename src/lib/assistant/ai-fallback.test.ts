import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ExtractedCriteria } from "./extract";

const getUserDb = vi.fn();
const extract = vi.fn();

vi.mock("next/cache", () => ({ cacheLife: () => {} }));
vi.mock("@/lib/supabase/user-client", () => ({ getUserDb: () => getUserDb() }));
vi.mock("./gemini", () => ({
  createGeminiExtractor: () => ({ model: "test-model", extract }),
}));

const { createAiFallback } = await import("./ai-fallback");

const CRITERIA: ExtractedCriteria = {
  onTopic: true,
  categorySlugs: ["toilets"],
  searchTerms: null,
  quantity: null,
  unit: null,
  budgetUsd: null,
  countries: [],
  certifications: [],
  verifiedOnly: false,
  priority: "balanced",
};

function userWithRpc(result: { data: unknown; error: { code: string; message: string } | null }) {
  const rpc = vi.fn(async () => result);
  getUserDb.mockResolvedValue({ userId: "user_1", db: { rpc } });
  return rpc;
}

describe("createAiFallback", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    getUserDb.mockReset();
    extract.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("is off when no API key is configured", () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    expect(createAiFallback("en")).toBeUndefined();
  });

  it("asks anonymous buyers to sign in without calling the model", async () => {
    getUserDb.mockResolvedValue(null);

    const outcome = await createAiFallback("en")!("leaky terrace");

    expect(outcome).toEqual({ status: "signIn" });
    expect(extract).not.toHaveBeenCalled();
  });

  it("reserves the quota before calling the model", async () => {
    const rpc = userWithRpc({ data: true, error: null });
    extract.mockResolvedValue(CRITERIA);

    const outcome = await createAiFallback("es")!("algo para un baño de hotel");

    expect(rpc).toHaveBeenCalledWith("reserve_ai_use", {
      p_query: "algo para un baño de hotel",
      p_locale: "es",
      p_model: "gemini-3.1-flash-lite",
    });
    expect(rpc.mock.invocationCallOrder[0]).toBeLessThan(extract.mock.invocationCallOrder[0]);
    expect(outcome).toEqual({ status: "ok", criteria: CRITERIA });
  });

  it("stops at the daily limit without calling the model", async () => {
    userWithRpc({ data: false, error: null });

    const outcome = await createAiFallback("en")!("leaky terrace");

    expect(outcome).toEqual({ status: "limit" });
    expect(extract).not.toHaveBeenCalled();
  });

  it("does not call the model when the reservation fails", async () => {
    userWithRpc({ data: null, error: { code: "42883", message: "function missing" } });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const outcome = await createAiFallback("en")!("leaky terrace");

    expect(outcome).toEqual({ status: "unavailable" });
    expect(extract).not.toHaveBeenCalled();
  });

  it("reports the model as unavailable when it fails", async () => {
    userWithRpc({ data: true, error: null });
    extract.mockResolvedValue(null);

    const outcome = await createAiFallback("en")!("leaky terrace");

    expect(outcome).toEqual({ status: "unavailable" });
  });
});
