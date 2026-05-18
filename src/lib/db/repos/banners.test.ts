import { beforeEach, describe, expect, it } from "vitest";
import { __resetBannersRepo, bannersRepo } from "./banners";

describe("bannersRepo (mock)", () => {
  beforeEach(() => __resetBannersRepo());

  it("lists active banners by placement sorted by sortOrder", async () => {
    const result = await bannersRepo.listByPlacement("home-hero");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((b) => b.placement === "home-hero" && b.active)).toBe(true);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.sortOrder <= result[i]!.sortOrder).toBe(true);
    }
  });

  it("returns empty for an unknown placement", async () => {
    const result = await bannersRepo.listByPlacement("shop-strip");
    expect(result).toEqual([]);
  });

  it("listAll returns all banners (active and inactive)", async () => {
    const all = await bannersRepo.listAll();
    expect(all.length).toBeGreaterThan(0);
  });

  it("create adds a new banner and getById retrieves it", async () => {
    const banner = await bannersRepo.create({
      placement: "shop-strip",
      imageUrl: "https://example.com/img.jpg",
      imageAlt: "Test banner",
      title: "Shop Sale",
      ctaLabel: "Shop now",
      ctaHref: "/shop",
      sortOrder: 5,
      active: true,
    });
    expect(banner.id).toMatch(/^bnr_/);
    const fetched = await bannersRepo.getById(banner.id);
    expect(fetched?.title).toBe("Shop Sale");
  });

  it("update modifies banner fields", async () => {
    const banner = await bannersRepo.create({
      placement: "home-strip",
      imageUrl: "https://example.com/img2.jpg",
      imageAlt: "Update test",
      title: "Old Title",
      ctaLabel: "Click",
      ctaHref: "/old",
      sortOrder: 1,
      active: true,
    });
    const updated = await bannersRepo.update(banner.id, { title: "New Title", active: false });
    expect(updated?.title).toBe("New Title");
    expect(updated?.active).toBe(false);
  });

  it("delete removes the banner", async () => {
    const banner = await bannersRepo.create({
      placement: "home-hero",
      imageUrl: "https://example.com/img3.jpg",
      imageAlt: "Delete test",
      title: "To Delete",
      ctaLabel: "Go",
      ctaHref: "/delete",
      sortOrder: 99,
      active: false,
    });
    await bannersRepo.delete(banner.id);
    const fetched = await bannersRepo.getById(banner.id);
    expect(fetched).toBeNull();
  });
});
