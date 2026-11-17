import { describe, expect, test } from "vitest";

import { loginSchema, parseForm, profileSchema, rfqSchema, safeNextPath, signupSchema } from "./validation";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";

describe("safeNextPath", () => {
  test("acepta rutas propias", () => {
    expect(safeNextPath("/account/rfqs")).toBe("/account/rfqs");
  });

  test.each(["https://evil.test", "//evil.test", "/\\evil.test", "javascript:alert(1)", "/a\nb", 5, undefined])(
    "rechaza %s y usa la ruta por defecto",
    (value) => {
      expect(safeNextPath(value)).toBe("/account");
    },
  );
});

describe("parseForm", () => {
  test("recorta espacios y devuelve los datos válidos", () => {
    const result = parseForm(loginSchema, form({ email: " a@b.co ", password: "x" }), ["email", "password"]);
    expect(result).toEqual({ ok: true, data: { email: "a@b.co", password: "x" } });
  });

  test("devuelve el primer código de error por campo", () => {
    const result = parseForm(signupSchema, form({ email: "no", password: "123", fullName: "" }), [
      "email",
      "password",
      "fullName",
    ]);
    expect(result).toEqual({ ok: false, errors: { email: "emailInvalid", password: "passwordShort" } });
  });

  test("trata un campo ausente como vacío", () => {
    const result = parseForm(loginSchema, new FormData(), ["email", "password"]);
    expect(result.ok).toBe(false);
  });
});

describe("profileSchema", () => {
  test("acepta país vacío o de dos letras mayúsculas", () => {
    expect(profileSchema.safeParse({ fullName: "Ana", company: "", countryCode: "" }).success).toBe(true);
    expect(profileSchema.safeParse({ fullName: "Ana", company: "", countryCode: "VN" }).success).toBe(true);
    expect(profileSchema.safeParse({ fullName: "Ana", company: "", countryCode: "vn" }).success).toBe(false);
  });
});

describe("rfqSchema", () => {
  const valid = { productId: PRODUCT_ID, quantity: "250", message: "Necesito 250 m2", destination: "" };

  test("convierte la cantidad a número", () => {
    const result = rfqSchema.safeParse(valid);
    expect(result.success && result.data.quantity).toBe(250);
  });

  test.each(["0", "-3", "abc", "1e12"])("rechaza la cantidad %s", (quantity) => {
    expect(rfqSchema.safeParse({ ...valid, quantity }).success).toBe(false);
  });

  test("rechaza un mensaje vacío o demasiado largo", () => {
    expect(rfqSchema.safeParse({ ...valid, message: "" }).success).toBe(false);
    expect(rfqSchema.safeParse({ ...valid, message: "x".repeat(4001) }).success).toBe(false);
  });

  test("rechaza un id que no es UUID", () => {
    expect(rfqSchema.safeParse({ ...valid, productId: "1" }).success).toBe(false);
  });
});
