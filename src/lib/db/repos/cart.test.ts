import { beforeEach, describe, expect, it } from "vitest";
import { __resetCartRepo, cartRepo } from "./cart";

describe("cartRepo (mock)", () => {
  beforeEach(() => __resetCartRepo());

  it("creates an empty cart on first access", async () => {
    const cart = await cartRepo.getOrCreateForGuestSession("gs_test1");
    expect(cart.id).toMatch(/^cart_/);
    expect(cart.guestSessionId).toBe("gs_test1");
    expect(cart.items).toEqual([]);
  });

  it("returns the same cart on repeat access", async () => {
    const a = await cartRepo.getOrCreateForGuestSession("gs_test2");
    const b = await cartRepo.getOrCreateForGuestSession("gs_test2");
    expect(b.id).toBe(a.id);
  });

  it("adds a new item", async () => {
    const cart = await cartRepo.addItem("gs_test3", {
      productId: "p",
      productSlug: "p-slug",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 2,
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(2);
  });

  it("merges quantity on duplicate sku", async () => {
    await cartRepo.addItem("gs_test4", {
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 1,
    });
    const cart = await cartRepo.addItem("gs_test4", {
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 3,
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(4);
  });

  it("updates quantity of a specific item", async () => {
    let cart = await cartRepo.addItem("gs_test5", {
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 1,
    });
    const itemId = cart.items[0]!.id;
    cart = await cartRepo.updateQuantity("gs_test5", itemId, 5);
    expect(cart.items[0]?.quantity).toBe(5);
  });

  it("removes an item", async () => {
    let cart = await cartRepo.addItem("gs_test6", {
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 1,
    });
    const itemId = cart.items[0]!.id;
    cart = await cartRepo.removeItem("gs_test6", itemId);
    expect(cart.items).toHaveLength(0);
  });

  it("clears the cart", async () => {
    await cartRepo.addItem("gs_test7", {
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 1,
    });
    const cart = await cartRepo.clear("gs_test7");
    expect(cart.items).toHaveLength(0);
  });
});
