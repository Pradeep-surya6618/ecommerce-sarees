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

  it("getOrCreateForUser returns the same cart on repeat access", async () => {
    const a = await cartRepo.getOrCreateForUser("usr_a");
    const b = await cartRepo.getOrCreateForUser("usr_a");
    expect(b.id).toBe(a.id);
    expect(a.userId).toBe("usr_a");
  });

  it("mergeGuestIntoUser merges items keyed by variantSku", async () => {
    await cartRepo.addItem("gs_m1", {
      productId: "p1",
      productSlug: "p1",
      productName: "P1",
      variantSku: "v-red",
      variantLabel: "Red",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 100000,
      quantity: 2,
    });
    await cartRepo.addItem("gs_m1", {
      productId: "p2",
      productSlug: "p2",
      productName: "P2",
      variantSku: "v-blue",
      variantLabel: "Blue",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 50000,
      unitMrpPaise: 50000,
      quantity: 1,
    });
    await cartRepo.addItemAsUser("usr_m1", {
      productId: "p1",
      productSlug: "p1",
      productName: "P1",
      variantSku: "v-red",
      variantLabel: "Red",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 100000,
      quantity: 1,
    });

    const merged = await cartRepo.mergeGuestIntoUser("gs_m1", "usr_m1");
    expect(merged.items).toHaveLength(2);
    const red = merged.items.find((i) => i.variantSku === "v-red");
    const blue = merged.items.find((i) => i.variantSku === "v-blue");
    expect(red?.quantity).toBe(3);
    expect(blue?.quantity).toBe(1);

    // Guest cart cleared
    const guest = await cartRepo.getOrCreateForGuestSession("gs_m1");
    expect(guest.items).toEqual([]);
  });
});
