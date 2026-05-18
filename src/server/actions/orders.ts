"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
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
  const user = await getCurrentUser();
  let cart;
  if (user) {
    cart = await cartRepo.getOrCreateForUser(user.id);
  } else {
    const guestSessionId = await ensureGuestSessionId();
    cart = await cartRepo.getOrCreateForGuestSession(guestSessionId);
  }

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
    userId: user?.id ?? null,
    guestSessionId: user ? null : cart.guestSessionId,
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

  if (user) {
    await cartRepo.clearAsUser(user.id);
  } else if (cart.guestSessionId) {
    await cartRepo.clear(cart.guestSessionId);
  }
  revalidatePath("/", "layout");
  redirect(`/checkout/success/${order.id}`);
}
