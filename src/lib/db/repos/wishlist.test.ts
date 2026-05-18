import { beforeEach, describe, expect, it } from "vitest";
import { __resetWishlistRepo, wishlistRepo } from "./wishlist";

const sample = {
  userId: "usr_w",
  productId: "prd_a",
  productSlug: "p-a",
  productName: "Amrita",
  imageUrl: "https://x/y.jpg",
  priceInPaise: 100000,
  mrpInPaise: 120000,
};

describe("wishlistRepo (mock)", () => {
  beforeEach(() => __resetWishlistRepo());

  it("adds an item idempotently per (userId, productId)", async () => {
    await wishlistRepo.add(sample);
    await wishlistRepo.add(sample);
    const list = await wishlistRepo.listByUser("usr_w");
    expect(list).toHaveLength(1);
  });

  it("removes an item by productId", async () => {
    await wishlistRepo.add(sample);
    await wishlistRepo.remove("usr_w", "prd_a");
    expect(await wishlistRepo.listByUser("usr_w")).toEqual([]);
  });

  it("has() answers product membership", async () => {
    await wishlistRepo.add(sample);
    expect(await wishlistRepo.has("usr_w", "prd_a")).toBe(true);
    expect(await wishlistRepo.has("usr_w", "prd_other")).toBe(false);
  });
});
