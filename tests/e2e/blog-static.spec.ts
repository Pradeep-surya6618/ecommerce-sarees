import { expect, test } from "@playwright/test";

test.describe("Blog and static pages", () => {
  test("/blog list renders posts and a card links to detail", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const postLinks = page.locator("a[href^='/blog/']");
    expect(await postLinks.count()).toBeGreaterThan(0);
  });

  test("/blog/[slug] detail renders title and body paragraphs", async ({ page }) => {
    await page.goto("/blog/how-to-choose-a-kanjivaram");
    await expect(page.getByRole("heading", { level: 1, name: /Kanjivaram/i })).toBeVisible();
    const paragraphs = page.locator("article p");
    expect(await paragraphs.count()).toBeGreaterThan(2);
  });

  test("/about, /contact, and /policies/shipping all return 200 and render a heading", async ({
    page,
  }) => {
    for (const path of [
      "/about",
      "/contact",
      "/policies/shipping",
      "/policies/returns",
      "/policies/care",
      "/policies/terms",
      "/policies/privacy",
    ]) {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });
});

test.describe("Admin settings page", () => {
  test("admin can reach /admin/settings", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/^Email/i).fill("admin@example.com");
    await page.getByLabel(/^Password/i).fill("AdminDemo!23");
    await page.getByRole("button", { name: /^Sign in$/i }).click();
    await page.waitForURL(/\/admin(\?|$)/);
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { level: 1, name: /Settings/ })).toBeVisible();
  });
});
