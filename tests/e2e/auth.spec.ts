import { expect, test } from "@playwright/test";

test.describe("Auth flow", () => {
  test("sign up, verify OTP, land on account page", async ({ page }) => {
    const email = `test+${Date.now()}@example.com`;

    await page.goto("/auth/signup");
    await page.getByLabel(/Full name/i).fill("Test User");
    await page.getByLabel(/^Email/i).fill(email);
    await page.getByLabel(/^Password/i).fill("Hunter22!");
    await page.getByRole("button", { name: /Create account/i }).click();

    await expect(page).toHaveURL(/\/auth\/verify\?email=/);

    // Demo OTP is 123456 — fill across the 6 inputs
    const digits = page.getByLabel(/^Digit \d$/);
    for (let i = 0; i < 6; i++) {
      await digits.nth(i).fill("123456"[i]!);
    }

    await page.getByRole("button", { name: /Verify and continue/i }).click();
    await expect(page).toHaveURL(/\/account(\?|$)/);
    // Sanity: assert we are NOT on the login page
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await page.waitForLoadState("networkidle");
    // Phase 5 dashboard greets the first name only — "Welcome back, Test."
    await expect(page.getByRole("heading", { level: 1, name: /Welcome back, Test/ })).toBeVisible();
  });

  test("middleware redirects unauthenticated /account access to /auth/login", async ({ page }) => {
    const res = await page.goto("/account");
    await expect(page).toHaveURL(/\/auth\/login/);
    expect(res?.status()).toBeLessThan(400);
  });

  test("login rejects wrong password", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel(/^Email/i).fill("nobody@example.com");
    await page.getByLabel(/^Password/i).fill("wrong-password");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText(/incorrect/i)).toBeVisible();
  });
});
