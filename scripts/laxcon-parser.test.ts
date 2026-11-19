import { describe, expect, it } from "vitest";

import { parseLaxconProduct } from "./laxcon-parser";

const URL = "https://www.laxconsteels.com/products/bright-bars/";

const MARKDOWN = `Stainless Steel Bright Bar Manufacturer in India, 5-115 mm      [Skip to content](#main)

# Stainless Steel Bright Bars

Cold finished stainless steel round bar, 5 mm to 115 mm

[REQUEST A QUOTE](/contact/?product=bright-bars#form)

![Stainless steel bright bars](/images/products/bright-bars-1200x800.webp)

## Product Description

Bright bar is **cold finished** bar. See the [proof machined bar](/products/forged-proof-machined-bars/) page.

Sizes above 115 mm are made to order.

## Bright Bar Specifications

Size range

5 mm to 115 mm

Finish

Cold drawn, peeled
Polished

Grades

300 and 400 series

## Related products

Something else
`;

describe("parseLaxconProduct", () => {
  it("reads the product name from the first heading", () => {
    expect(parseLaxconProduct(MARKDOWN, URL).name).toBe("Stainless Steel Bright Bars");
  });

  it("reads the one-line summary under the title", () => {
    expect(parseLaxconProduct(MARKDOWN, URL).summary).toBe(
      "Cold finished stainless steel round bar, 5 mm to 115 mm",
    );
  });

  it("builds the description from the product description section, without link syntax", () => {
    const { description } = parseLaxconProduct(MARKDOWN, URL);
    expect(description).toBe(
      "Bright bar is cold finished bar. See the proof machined bar page.\n\nSizes above 115 mm are made to order.",
    );
  });

  it("pairs each specification label with its value", () => {
    expect(parseLaxconProduct(MARKDOWN, URL).specs).toEqual([
      { label: "Size range", value: "5 mm to 115 mm" },
      { label: "Finish", value: "Cold drawn, peeled / Polished" },
      { label: "Grades", value: "300 and 400 series" },
    ]);
  });

  it("makes the image address absolute", () => {
    expect(parseLaxconProduct(MARKDOWN, URL).imageUrl).toBe(
      "https://www.laxconsteels.com/images/products/bright-bars-1200x800.webp",
    );
  });

  it("uses the page path as the external id and keeps the source address", () => {
    const parsed = parseLaxconProduct(MARKDOWN, URL);
    expect(parsed.externalId).toBe("bright-bars");
    expect(parsed.sourceUrl).toBe(URL);
  });

  it("drops a specification that has a label but no value", () => {
    const odd = MARKDOWN.replace("Grades\n\n300 and 400 series\n", "Grades\n");
    expect(parseLaxconProduct(odd, URL).specs.map((s) => s.label)).toEqual([
      "Size range",
      "Finish",
    ]);
  });

  it("throws when the page has no product heading", () => {
    expect(() => parseLaxconProduct("just text", URL)).toThrow(/título/i);
  });

  it("throws when the page has no product description", () => {
    expect(() => parseLaxconProduct("# Title\n\nSummary\n", URL)).toThrow(/descripción/i);
  });
});
