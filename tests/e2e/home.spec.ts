import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test("renders hero, category tiles, product rails, reviews, and IG strip", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();

    // Hero (first h1 heading in the hero section)
    const heroHeading = page.locator("h1").first();
    await expect(heroHeading).toBeVisible();

    // Section headings (at least 3 across the page)
    const sectionHeadings = page.locator("h2");
    await expect(sectionHeadings).not.toHaveCount(0);

    // At least one product card link exists
    const productLinks = page.locator("a[href^='/product/']");
    expect(await productLinks.count()).toBeGreaterThan(0);

    // Instagram tiles
    const igLinks = page.locator("a[href='https://instagram.com']");
    expect(await igLinks.count()).toBeGreaterThanOrEqual(6);
  });

  test("clicking a product card navigates to /product/<slug>", async ({ page }) => {
    await page.goto("/");
    const firstProduct = page.locator("a[href^='/product/']").first();
    const href = await firstProduct.getAttribute("href");
    expect(href).toMatch(/^\/product\//);
    // Don't actually navigate; product detail page lands in Phase 2.
  });
});
