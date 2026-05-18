import { expect, test } from "@playwright/test";

async function signUpAndVerify(page: import("@playwright/test").Page, email: string) {
  await page.goto("/auth/signup");
  await page.getByLabel(/Full name/i).fill("Account Test");
  await page.getByLabel(/^Email/i).fill(email);
  await page.getByLabel(/^Password/i).fill("Hunter22!");
  await page.getByRole("button", { name: /Create account/i }).click();
  await expect(page).toHaveURL(/\/auth\/verify\?email=/);
  const digits = page.getByLabel(/^Digit \d$/);
  for (let i = 0; i < 6; i++) {
    await digits.nth(i).fill("123456"[i]!);
  }
  await page.getByRole("button", { name: /Verify and continue/i }).click();
  await expect(page).toHaveURL(/\/account(\?|$)/);
}

test.describe("Account flow", () => {
  test("user can add an address from /account/addresses", async ({ page }) => {
    await signUpAndVerify(page, `addr+${Date.now()}@example.com`);
    await page.goto("/account/addresses");
    await page.getByLabel(/Full name/i).fill("Test User");
    await page.getByLabel(/Mobile/i).fill("9876543210");
    await page.getByLabel(/^Email/i).fill("addr@example.com");
    await page.getByLabel(/Address line 1/i).fill("1 Anna Salai");
    await page.getByLabel(/^City/i).fill("Chennai");
    await page.getByLabel(/^Pincode/i).fill("600002");
    await page.getByLabel(/^State/i).selectOption("Tamil Nadu");
    await page.getByRole("button", { name: /Add address/i }).click();
    await expect(page.getByText(/Address added/)).toBeVisible();
  });

  test("placing an order while signed in routes it to /account/orders", async ({ page }) => {
    await signUpAndVerify(page, `order+${Date.now()}@example.com`);

    await page.goto("/product/amrita-kanjivaram");
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await expect(page.getByText(/Added \d+ × Amrita Kanjivaram to cart/)).toBeVisible();

    await page.goto("/checkout");
    await page.getByLabel(/Full name/i).fill("Order Tester");
    await page.getByLabel(/Mobile number/i).fill("9876543210");
    await page.getByLabel(/^Email/i).fill("order@example.com");
    await page.getByLabel(/Address line 1/i).fill("1 Anna Salai");
    await page.getByLabel(/^City/i).fill("Chennai");
    await page.getByLabel(/^Pincode/i).fill("600002");
    await page.getByLabel(/^State/i).selectOption("Tamil Nadu");
    await page.getByRole("button", { name: /Continue to shipping/i }).click();
    await page.getByRole("button", { name: /Continue to payment/i }).click();
    await page.getByRole("button", { name: /Cash on delivery/i }).click();
    await page.getByRole("button", { name: /Place order/i }).click();

    await expect(page).toHaveURL(/\/checkout\/success\/ord_/);

    await page.goto("/account/orders");
    await expect(page.getByRole("heading", { name: /Your orders/i })).toBeVisible();
    const orderLinks = page.locator("a[href^='/account/orders/ord_']");
    expect(await orderLinks.count()).toBeGreaterThan(0);
  });
});
