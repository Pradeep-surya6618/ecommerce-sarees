"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureGuestSessionId } from "@/lib/cart/guest-session";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise } from "@/lib/cart/totals";
import { cartRepo } from "@/lib/db/repos/cart";
import { ordersRepo } from "@/lib/db/repos/orders";
import type { Address, OrderItem, PaymentMethod, ShippingOption } from "@/types/domain";

export interface PlaceOrderInput {
  shippingAddress: Address;
  shippingOption: ShippingOption;
  paymentMethod: PaymentMethod;
  customerNotes?: string;
}

export async function placeOrderAction(input: PlaceOrderInput): Promise<void> {
  const guestSessionId = await ensureGuestSessionId();
  const cart = await cartRepo.getOrCreateForGuestSession(guestSessionId);

  if (cart.items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const items: OrderItem[] = cart.items.map((i) => ({
    productId: i.productId,
    productSlug: i.productSlug,
    productName: i.productName,
    variantSku: i.variantSku,
    variantLabel: i.variantLabel,
    imageUrl: i.imageUrl,
    unitPricePaise: i.unitPricePaise,
    quantity: i.quantity,
    lineTotalPaise: i.unitPricePaise * i.quantity,
  }));

  const subtotalPaise = computeSubtotalPaise(cart.items);
  const taxPaise = computeTaxPaise(subtotalPaise);
  const shippingPaise = input.shippingOption.pricePaise;
  const totalPaise = computeTotalPaise({ subtotalPaise, taxPaise, shippingPaise });

  const order = await ordersRepo.create({
    userId: null,
    guestSessionId,
    items,
    subtotalPaise,
    shippingPaise,
    taxPaise,
    totalPaise,
    paymentMethod: input.paymentMethod,
    shippingAddress: input.shippingAddress,
    shippingOption: input.shippingOption,
    customerNotes: input.customerNotes,
  });

  await cartRepo.clear(guestSessionId);
  revalidatePath("/", "layout");
  redirect(`/checkout/success/${order.id}`);
}
