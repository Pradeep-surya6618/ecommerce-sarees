import { expect, test } from "@playwright/test";

test.describe("Checkout flow", () => {
  test("place a COD order end-to-end", async ({ page }) => {
    await page.goto("/product/amrita-kanjivaram");
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await expect(page.getByText(/Added \d+ × Amrita Kanjivaram to cart/)).toBeVisible();

    await page.goto("/checkout");
    await expect(page.getByRole("heading", { level: 1, name: /Checkout/i })).toBeVisible();

    // Step 1: address
    await page.getByLabel(/Full name/i).fill("Aishwarya Ramaswamy");
    await page.getByLabel(/Mobile number/i).fill("9876543210");
    await page.getByLabel(/^Email/i).fill("aishwarya@example.com");
    await page.getByLabel(/Address line 1/i).fill("1 Anna Salai");
    await page.getByLabel(/^City/i).fill("Chennai");
    await page.getByLabel(/^Pincode/i).fill("600002");
    await page.getByLabel(/^State/i).selectOption("Tamil Nadu");
    await page.getByRole("button", { name: /Continue to shipping/i }).click();

    // Step 2: shipping
    await expect(page.getByRole("heading", { name: /^Shipping$/ })).toBeVisible();
    await page.getByRole("button", { name: /Continue to payment/i }).click();

    // Step 3: payment
    await page.getByRole("button", { name: /Cash on delivery/i }).click();
    await page.getByRole("button", { name: /Place order/i }).click();

    await expect(page).toHaveURL(/\/checkout\/success\/ord_/);
    await expect(page.getByRole("heading", { level: 1, name: /Thank you/i })).toBeVisible();
  });
});
