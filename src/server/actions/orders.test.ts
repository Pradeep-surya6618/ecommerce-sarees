import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetCartRepo, cartRepo } from "@/lib/db/repos/cart";
import { __resetOrdersRepo, ordersRepo } from "@/lib/db/repos/orders";
import type { Address, ShippingOption } from "@/types/domain";
import { placeOrderAction } from "./orders";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const redirectMock = vi.fn((_: string) => {
  throw new Error("NEXT_REDIRECT");
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));

vi.mock("@/lib/cart/guest-session", () => ({
  ensureGuestSessionId: vi.fn(async () => "gs_order_test"),
  getGuestSessionId: vi.fn(async () => "gs_order_test"),
}));

const getCurrentUserMock = vi.hoisted(() =>
  vi.fn<() => Promise<{ id: string; emailVerified: boolean } | null>>(async () => null),
);
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: getCurrentUserMock }));

const address: Address = {
  fullName: "Aishwarya R.",
  phone: "9876543210",
  email: "a@example.com",
  line1: "1 Anna Salai",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600002",
  country: "IN",
};

const shipping: ShippingOption = {
  id: "std",
  name: "Standard delivery",
  etaDays: 5,
  pricePaise: 8000,
};

describe("placeOrderAction", () => {
  beforeEach(() => {
    __resetCartRepo();
    __resetOrdersRepo();
    redirectMock.mockClear();
    getCurrentUserMock.mockReset();
    getCurrentUserMock.mockResolvedValue(null);
  });

  it("snapshots the cart into an order and clears the cart", async () => {
    await cartRepo.addItem("gs_order_test", {
      productId: "p",
      productSlug: "p",
      productName: "Amrita",
      variantSku: "sku",
      variantLabel: "Maroon",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 2,
    });

    await expect(
      placeOrderAction({
        shippingAddress: address,
        shippingOption: shipping,
        paymentMethod: "cod",
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const cartAfter = await cartRepo.getOrCreateForGuestSession("gs_order_test");
    expect(cartAfter.items).toHaveLength(0);

    const all = await ordersRepo.listByGuestSession("gs_order_test");
    expect(all).toHaveLength(1);
    const order = all[0]!;
    expect(order.items[0]?.quantity).toBe(2);
    expect(order.subtotalPaise).toBe(200000);
    expect(order.taxPaise).toBe(10000);
    expect(order.shippingPaise).toBe(8000);
    expect(order.totalPaise).toBe(218000);
    expect(order.paymentMethod).toBe("cod");

    expect(redirectMock).toHaveBeenCalledWith(`/checkout/success/${order.id}`);
  });

  it("throws when the cart is empty", async () => {
    await expect(
      placeOrderAction({
        shippingAddress: address,
        shippingOption: shipping,
        paymentMethod: "razorpay",
      }),
    ).rejects.toThrow(/empty/i);
  });

  it("uses the user cart and sets userId on the order when signed in", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "usr_user1", emailVerified: true });
    await cartRepo.addItemAsUser("usr_user1", {
      productId: "p",
      productSlug: "p",
      productName: "Amrita",
      variantSku: "sku",
      variantLabel: "Maroon",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 1,
    });
    await expect(
      placeOrderAction({
        shippingAddress: address,
        shippingOption: shipping,
        paymentMethod: "razorpay",
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    const userOrders = await ordersRepo.listByUser("usr_user1");
    expect(userOrders).toHaveLength(1);
    expect(userOrders[0]?.userId).toBe("usr_user1");
    const cartAfter = await cartRepo.getOrCreateForUser("usr_user1");
    expect(cartAfter.items).toEqual([]);
  });
});
