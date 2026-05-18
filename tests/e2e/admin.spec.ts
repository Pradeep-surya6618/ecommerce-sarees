import { expect, test } from "@playwright/test";

test.describe("Admin flow", () => {
  test("admin can sign in and reach the dashboard", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/^Email/i).fill("admin@example.com");
    await page.getByLabel(/^Password/i).fill("AdminDemo!23");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(\?|$)/);
    await expect(page.getByRole("heading", { level: 1, name: /Dashboard/ })).toBeVisible();
  });

  test("customer cannot reach /admin (redirected to /admin/login)", async ({ page }) => {
    // Sign up + verify as a customer
    const email = `customer+${Date.now()}@example.com`;
    await page.goto("/auth/signup");
    await page.getByLabel(/Full name/i).fill("Customer Test");
    await page.getByLabel(/^Email/i).fill(email);
    await page.getByLabel(/^Password/i).fill("Hunter22!");
    await page.getByRole("button", { name: /Create account/i }).click();
    const digits = page.getByLabel(/^Digit \d$/);
    for (let i = 0; i < 6; i++) await digits.nth(i).fill("123456"[i]!);
    await page.getByRole("button", { name: /Verify and continue/i }).click();
    await expect(page).toHaveURL(/\/account(\?|$)/);

    // Try to reach /admin — should bounce to /admin/login
    // The middleware lets the customer through (session cookie present),
    // then the (admin) layout enforces role and redirects to /admin/login?error=forbidden
    const res = await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    expect(res?.status()).toBeLessThan(400);
  });

  test("Google sign-in mock signs the user in via the picker", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("button", { name: /Continue with Google/i }).click();
    await page.getByRole("button", { name: /Priya Sharma/ }).click();
    await expect(page).toHaveURL(/\/account(\?|$)/);
  });
});
