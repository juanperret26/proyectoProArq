import { expect, test } from "@playwright/test";

test.describe("catalog and language", () => {
  test("the home page loads in English and switches to Spanish", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Construction materials");

    await page.getByRole("button", { name: /Ver el sitio en español/ }).click();

    await expect(page).toHaveURL(/\/es$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Materiales de construcción");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });

  test("searching and filtering by country narrows the results", async ({ page }) => {
    await page.goto("/en/search?q=porcelain");
    const count = page.locator("#results-count");
    await expect(count).toContainText("products");
    const before = Number((await count.innerText()).match(/\d+/)?.[0]);

    await page.getByLabel("Vietnam").check();
    await page.getByRole("button", { name: "Apply filters" }).click();

    await expect(page).toHaveURL(/country=VN/);
    const after = Number((await page.locator("#results-count").innerText()).match(/\d+/)?.[0]);
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
  });

  test("a product page shows its price tiers and supplier", async ({ page }) => {
    await page.goto("/en/search?q=portland+cement");
    await page.locator("article h3 a").first().click();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Price by quantity").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "View supplier profile" })).toBeVisible();
  });
});

test.describe("compare", () => {
  test("three products are compared side by side", async ({ page }) => {
    await page.goto("/en/search?q=porcelain");
    // Cada botón cambia a "Added" al elegirse, así que siempre se toma el primero sin elegir.
    const unselected = page.locator('button[aria-pressed="false"]');
    for (let i = 0; i < 3; i += 1) {
      await unselected.first().click();
      await expect(page.getByText(`${i + 1} of 4 selected`).first()).toBeVisible();
    }

    await page.getByRole("link", { name: "Compare now" }).click();

    await expect(page).toHaveURL(/\/compare\?ids=/);
    const table = page.getByRole("region", { name: /Side-by-side comparison/ });
    await expect(table.getByRole("columnheader")).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "Purchase analysis" })).toBeVisible();
  });
});

test.describe("assistant", () => {
  test("a request with a material returns ranked recommendations and what was understood", async ({
    page,
  }) => {
    await page.goto("/en/assistant");
    await page.getByLabel("Your request").fill("200 bags of portland cement, urgent, not from China");
    await page.getByRole("button", { name: "Find products" }).click();

    await expect(page.getByRole("heading", { name: "What I understood" })).toBeVisible();
    await expect(page.getByText("200 bags", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /recommendations out of/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Adjust filters in the catalog" })).toBeVisible();
  });

  test("a greeting is rejected as off-topic without searching", async ({ page }) => {
    await page.goto("/en/assistant?q=hello");

    await expect(
      page.getByRole("heading", { name: "I can only help with construction materials" }),
    ).toBeVisible();
  });
});

test.describe("search engines and access control", () => {
  test("robots.txt hides private pages and points to the sitemap", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();

    expect(body).toContain("Disallow: /en/account");
    expect(body).toContain("Sitemap:");
  });

  test("sitemap.xml lists pages in both languages", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();

    expect(body).toContain("/en/categories/");
    expect(body).toContain("/es/products/");
    expect(body).toContain('hreflang="es"');
  });

  test("each page declares its own canonical address and translations", async ({ page }) => {
    for (const path of ["/search", "/assistant", "/compare", "/categories/rebar"]) {
      await page.goto(`/es${path}`);

      await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", new RegExp(`/es${path}$`));
      await expect(page.locator('link[rel=alternate][hreflang="en"]')).toHaveAttribute(
        "href",
        new RegExp(`/en${path}$`),
      );
    }
  });

  test("private pages send visitors to sign in", async ({ page }) => {
    await page.goto("/en/account");

    await expect(page).toHaveURL(/sign-in/);
  });
});
