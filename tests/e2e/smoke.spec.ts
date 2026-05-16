import { expect, test } from "@playwright/test";

test("home page responds with 200 and renders body", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
});
