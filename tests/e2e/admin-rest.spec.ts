import { expect, test } from "@playwright/test";

async function signInAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel(/^Email/i).fill("admin@example.com");
  await page.getByLabel(/^Password/i).fill("AdminDemo!23");
  await page.getByRole("button", { name: /^Sign in$/i }).click();
  await page.waitForURL(/\/admin(\?|$)/);
}

test.describe("Admin REST — orders, customers, coupons, banners", () => {
  test("admin can view /admin/orders with heading and AdminFilterBar", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/admin/orders");
    await expect(page.getByRole("heading", { level: 1, name: /Orders/i })).toBeVisible();
    // AdminFilterBar renders a search input
    await expect(page.getByRole("searchbox")).toBeVisible();
  });

  test("admin can view /admin/customers with heading", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/admin/customers");
    await expect(page.getByRole("heading", { level: 1, name: /Customers/i })).toBeVisible();
  });

  test("admin can create a coupon and land on the detail page", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/admin/coupons/new");
    await expect(page.getByRole("heading", { level: 1, name: /New coupon/i })).toBeVisible();

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 30);
    const futureDateStr = futureDate.toISOString().slice(0, 10);

    // Fill the code field
    await page.getByLabel(/^Code/i).fill("TEST10");

    // Select type = percent
    await page.getByLabel(/^Type/i).selectOption("percent");

    // Fill value
    await page.getByLabel(/^Value \(%\)/i).fill("10");

    // Fill validFrom date input
    await page.getByLabel(/^Valid from/i).fill(todayStr);

    // Fill validTo date input
    await page.getByLabel(/^Valid to/i).fill(futureDateStr);

    // Submit the form
    await page.getByRole("button", { name: /^Create coupon$/i }).click();

    // Should redirect to /admin/coupons/TEST10
    await page.waitForURL(/\/admin\/coupons\/TEST10/i);
    await expect(page).toHaveURL(/\/admin\/coupons\/TEST10/i);
  });

  test("admin can view /admin/banners with heading and banner rows from fixture", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/admin/banners");
    await expect(page.getByRole("heading", { level: 1, name: /Banners/i })).toBeVisible();
    // The fixture seeds 4 banners — at least one title should be visible in the table
    await expect(page.getByText("The Wedding Edit")).toBeVisible();
  });
});
