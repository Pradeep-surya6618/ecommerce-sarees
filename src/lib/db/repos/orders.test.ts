import { beforeEach, describe, expect, it } from "vitest";
import type { Address, OrderItem, ShippingOption } from "@/types/domain";
import { __resetOrdersRepo, ordersRepo } from "./orders";

const sampleAddress: Address = {
  fullName: "Aishwarya R.",
  phone: "9876543210",
  email: "a@example.com",
  line1: "1 Anna Salai",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600002",
  country: "IN",
};

const sampleShipping: ShippingOption = {
  id: "std",
  name: "Standard delivery",
  etaDays: 5,
  pricePaise: 8000,
};

const sampleItems: OrderItem[] = [
  {
    productId: "p1",
    productSlug: "p1-slug",
    productName: "Amrita Kanjivaram",
    variantSku: "amrita-maroon",
    variantLabel: "Maroon",
    imageUrl: "https://x/y.jpg",
    unitPricePaise: 4250000,
    quantity: 1,
    lineTotalPaise: 4250000,
  },
];

describe("ordersRepo (mock)", () => {
  beforeEach(() => __resetOrdersRepo());

  it("creates an order and returns it by id", async () => {
    const order = await ordersRepo.create({
      userId: null,
      guestSessionId: "gs_x",
      items: sampleItems,
      subtotalPaise: 4250000,
      shippingPaise: 8000,
      taxPaise: 212500,
      totalPaise: 4470500,
      paymentMethod: "razorpay",
      shippingAddress: sampleAddress,
      shippingOption: sampleShipping,
    });

    expect(order.id).toMatch(/^ord_/);
    expect(order.status).toBe("confirmed");
    expect(order.paymentStatus).toBe("pending");

    const fetched = await ordersRepo.getById(order.id);
    expect(fetched?.id).toBe(order.id);
  });

  it("returns null for unknown order id", async () => {
    expect(await ordersRepo.getById("ord_does_not_exist")).toBeNull();
  });

  it("lists orders for a guest session", async () => {
    await ordersRepo.create({
      userId: null,
      guestSessionId: "gs_alpha",
      items: sampleItems,
      subtotalPaise: 4250000,
      shippingPaise: 8000,
      taxPaise: 212500,
      totalPaise: 4470500,
      paymentMethod: "cod",
      shippingAddress: sampleAddress,
      shippingOption: sampleShipping,
    });
    const list = await ordersRepo.listByGuestSession("gs_alpha");
    expect(list).toHaveLength(1);
  });
});
