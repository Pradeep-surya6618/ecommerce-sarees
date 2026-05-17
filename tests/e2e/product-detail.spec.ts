import { expect, test } from "@playwright/test";

test.describe("Product detail", () => {
  test("renders product, variants, tabs, and add to cart", async ({ page }) => {
    await page.goto("/product/amrita-kanjivaram");
    await expect(page.getByRole("heading", { level: 1, name: /Amrita Kanjivaram/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Description/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add to cart/i })).toBeVisible();
  });

  test("switching variants does not 404", async ({ page }) => {
    await page.goto("/product/amrita-kanjivaram");
    const swatches = page.locator("button[aria-label='Maroon'], button[aria-label='Emerald']");
    expect(await swatches.count()).toBeGreaterThan(0);
    await swatches.first().click();
    await expect(page).toHaveURL(/\/product\/amrita-kanjivaram/);
  });

  test("pincode check renders eligibility info for a valid pincode", async ({ page }) => {
    await page.goto("/product/amrita-kanjivaram");
    await page.getByPlaceholder("6-digit pincode").fill("110001");
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByText(/Delivery in \d+ business days/)).toBeVisible();
  });

  test("clicking Add to cart shows a toast (stub)", async ({ page }) => {
    await page.goto("/product/amrita-kanjivaram");
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await expect(page.getByText(/Added \d+ × Amrita Kanjivaram to cart/)).toBeVisible();
  });

  test("404 for unknown product", async ({ page }) => {
    const res = await page.goto("/product/does-not-exist");
    expect(res?.status()).toBe(404);
  });
});
