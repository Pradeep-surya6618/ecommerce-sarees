import { expect, test } from "@playwright/test";

test.describe("Cart flow", () => {
  test("add a product to cart, see badge update, view cart page", async ({ page }) => {
    await page.goto("/product/amrita-kanjivaram");
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await expect(page.getByText(/Added \d+ × Amrita Kanjivaram to cart/)).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1, name: /Your cart/i })).toBeVisible();
    await expect(page.getByText("Amrita Kanjivaram")).toBeVisible();
  });

  test("update line quantity from cart page", async ({ page }) => {
    await page.goto("/product/kavya-linen");
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await expect(page.getByText(/Added \d+ × Kavya Linen to cart/)).toBeVisible();
    await page.goto("/cart");
    await page.getByRole("button", { name: "Increase quantity" }).first().click();
    await expect(page.locator("[aria-live='polite']").first()).toContainText("2");
  });

  test("empty cart shows empty state and link to shop", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByText(/Your cart is empty/)).toBeVisible();
  });
});
