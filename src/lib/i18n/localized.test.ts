import { describe, expect, it } from "vitest";
import { pickLocalized } from "./localized";

describe("pickLocalized", () => {
  it("devuelve el texto en español cuando el idioma activo es español", () => {
    expect(pickLocalized("es", "Steel", "Acero")).toBe("Acero");
  });

  it("devuelve el texto en inglés cuando el idioma activo es inglés", () => {
    expect(pickLocalized("en", "Steel", "Acero")).toBe("Steel");
  });

  it("usa inglés si falta la traducción al español", () => {
    expect(pickLocalized("es", "Steel", null)).toBe("Steel");
    expect(pickLocalized("es", "Steel", undefined)).toBe("Steel");
    expect(pickLocalized("es", "Steel", "   ")).toBe("Steel");
  });

  it("usa inglés para un idioma no soportado", () => {
    expect(pickLocalized("fr", "Steel", "Acero")).toBe("Steel");
  });
});
