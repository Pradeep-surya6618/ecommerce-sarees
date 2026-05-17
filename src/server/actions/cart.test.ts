import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetCartRepo, cartRepo } from "@/lib/db/repos/cart";
import { addToCartAction, removeCartItemAction, updateCartItemAction } from "./cart";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/cart/guest-session", () => ({
  ensureGuestSessionId: vi.fn(async () => "gs_action_test"),
  getGuestSessionId: vi.fn(async () => "gs_action_test"),
}));

describe("cart server actions", () => {
  beforeEach(() => __resetCartRepo());

  it("addToCartAction adds an item using the current guest session", async () => {
    await addToCartAction({
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
    const cart = await cartRepo.getOrCreateForGuestSession("gs_action_test");
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(2);
  });

  it("updateCartItemAction updates quantity", async () => {
    await addToCartAction({
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
    let cart = await cartRepo.getOrCreateForGuestSession("gs_action_test");
    const itemId = cart.items[0]!.id;
    await updateCartItemAction(itemId, 3);
    cart = await cartRepo.getOrCreateForGuestSession("gs_action_test");
    expect(cart.items[0]?.quantity).toBe(3);
  });

  it("removeCartItemAction removes an item", async () => {
    await addToCartAction({
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
    let cart = await cartRepo.getOrCreateForGuestSession("gs_action_test");
    const itemId = cart.items[0]!.id;
    await removeCartItemAction(itemId);
    cart = await cartRepo.getOrCreateForGuestSession("gs_action_test");
    expect(cart.items).toHaveLength(0);
  });
});
