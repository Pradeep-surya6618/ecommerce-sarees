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

  describe("search", () => {
    it("filters by category slug", async () => {
      const result = await productsRepo.search({ categorySlugs: ["kanjivaram"] });
      expect(result.items.every((p) => p.categorySlug === "kanjivaram")).toBe(true);
      expect(result.totalCount).toBeGreaterThan(0);
    });

    it("filters by fabric (substring, case-insensitive)", async () => {
      const result = await productsRepo.search({ fabrics: ["silk"] });
      expect(result.items.every((p) => p.fabric.toLowerCase().includes("silk"))).toBe(true);
    });

    it("filters by color name (exact, case-insensitive)", async () => {
      const result = await productsRepo.search({ colors: ["Maroon"] });
      expect(
        result.items.every((p) => p.variants.some((v) => v.colorName.toLowerCase() === "maroon")),
      ).toBe(true);
    });

    it("filters by price range", async () => {
      const result = await productsRepo.search({ priceMinPaise: 1000000, priceMaxPaise: 3000000 });
      expect(
        result.items.every((p) => p.priceInPaise >= 1000000 && p.priceInPaise <= 3000000),
      ).toBe(true);
    });

    it("returns empty when no products match", async () => {
      const result = await productsRepo.search({ fabrics: ["nonexistent-fabric"] });
      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it("sorts price ascending and descending", async () => {
      const asc = await productsRepo.search({ sort: "price-asc" });
      for (let i = 1; i < asc.items.length; i++) {
        expect(asc.items[i - 1]!.priceInPaise <= asc.items[i]!.priceInPaise).toBe(true);
      }
      const desc = await productsRepo.search({ sort: "price-desc" });
      for (let i = 1; i < desc.items.length; i++) {
        expect(desc.items[i - 1]!.priceInPaise >= desc.items[i]!.priceInPaise).toBe(true);
      }
    });

    it("paginates", async () => {
      const all = await productsRepo.search({});
      const page1 = await productsRepo.search({ page: 1, pageSize: 5 });
      const page2 = await productsRepo.search({ page: 2, pageSize: 5 });
      expect(page1.items).toHaveLength(5);
      expect(page1.hasMore).toBe(true);
      expect(page2.items[0]?.id).toBe(all.items[5]?.id);
      expect(page2.page).toBe(2);
    });

    it("filters by inStockOnly (any variant with stock > 0)", async () => {
      const result = await productsRepo.search({ inStockOnly: true });
      expect(result.items.every((p) => p.variants.some((v) => v.stock > 0))).toBe(true);
    });
  });
});
