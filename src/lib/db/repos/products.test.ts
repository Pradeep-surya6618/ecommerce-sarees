import { describe, expect, it } from "vitest";
import { productsRepo } from "./products";

describe("productsRepo (mock)", () => {
  it("lists active products only, sorted by createdAt desc", async () => {
    const result = await productsRepo.list();
    expect(result.length).toBeGreaterThanOrEqual(10);
    expect(result.every((p) => p.status === "active")).toBe(true);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.createdAt >= result[i]!.createdAt).toBe(true);
    }
  });

  it("lists featured products", async () => {
    const result = await productsRepo.listFeatured();
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.featured && p.status === "active")).toBe(true);
  });

  it("lists products by category slug", async () => {
    const result = await productsRepo.listByCategory("kanjivaram");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.categorySlug === "kanjivaram")).toBe(true);
  });

  it("gets a product by slug", async () => {
    const product = await productsRepo.getBySlug("amrita-kanjivaram");
    expect(product?.name).toBe("Amrita Kanjivaram");
  });

  it("returns null for unknown slug", async () => {
    const product = await productsRepo.getBySlug("does-not-exist");
    expect(product).toBeNull();
  });

  it("supports a limit option on list", async () => {
    const result = await productsRepo.list({ limit: 3 });
    expect(result).toHaveLength(3);
  });
});
