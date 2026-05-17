import { expect, test } from "@playwright/test";

test.describe("Shop pages", () => {
  test("/shop renders the listing, sort, and at least one product", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { level: 1, name: /All Sarees/i })).toBeVisible();
    const productLinks = page.locator("a[href^='/product/']");
    expect(await productLinks.count()).toBeGreaterThan(0);
    await expect(page.getByLabel("Sort")).toBeVisible();
  });

  test("/shop/silk filters to silk category", async ({ page }) => {
    await page.goto("/shop/silk");
    await expect(page.getByRole("heading", { level: 1, name: /Silk Sarees/i })).toBeVisible();
    const links = page.locator("a[href^='/product/']");
    expect(await links.count()).toBeGreaterThan(0);
  });

  test("changing sort updates the URL", async ({ page }) => {
    await page.goto("/shop");
    await page.getByLabel("Sort").selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
  });

  test("404 for unknown category", async ({ page }) => {
    const res = await page.goto("/shop/this-category-does-not-exist");
    expect(res?.status()).toBe(404);
  });
});
