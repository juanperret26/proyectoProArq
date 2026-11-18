import { describe, expect, it, vi } from "vitest";

import type { ExtractedCriteria } from "./extract";
import { createGeminiExtractor } from "./gemini";

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

function geminiResponse(text: string, status = 200): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status, headers: { "content-type": "application/json" } },
  );
}

describe("createGeminiExtractor", () => {
  it("sends the request as data with the key in a header and returns validated criteria", async () => {
    const fetchMock = vi.fn(async () => geminiResponse(JSON.stringify(CRITERIA)));
    const extractor = createGeminiExtractor({
      apiKey: "test-key",
      model: "test-model",
      fetchImpl: fetchMock,
    });

    const result = await extractor.extract("a toilet for a hotel");

    expect(result).toEqual(CRITERIA);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent",
    );
    expect(url).not.toContain("test-key");
    expect(new Headers(init.headers).get("x-goog-api-key")).toBe("test-key");
    const body = JSON.parse(String(init.body));
    expect(body.contents[0].parts[0].text).toBe(JSON.stringify({ request: "a toilet for a hotel" }));
    expect(body.generationConfig.responseMimeType).toBe("application/json");
  });

  it("returns null when the quota is exhausted", async () => {
    const extractor = createGeminiExtractor({
      apiKey: "k",
      model: "m",
      fetchImpl: async () => new Response("rate limited", { status: 429 }),
    });

    expect(await extractor.extract("toilets")).toBeNull();
  });

  it("returns null when the model answers with invalid JSON or the wrong shape", async () => {
    for (const text of ["not json", JSON.stringify({ onTopic: "yes" })]) {
      const extractor = createGeminiExtractor({
        apiKey: "k",
        model: "m",
        fetchImpl: async () => geminiResponse(text),
      });
      expect(await extractor.extract("toilets")).toBeNull();
    }
  });

  it("returns null when the network fails or times out", async () => {
    const extractor = createGeminiExtractor({
      apiKey: "k",
      model: "m",
      fetchImpl: async () => {
        throw new DOMException("timed out", "TimeoutError");
      },
    });

    expect(await extractor.extract("toilets")).toBeNull();
  });
});
