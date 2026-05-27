"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ensureGuestSessionId } from "@/lib/cart/guest-session";
import { getShippingOptions } from "@/lib/cart/shipping";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise } from "@/lib/cart/totals";
import { cartRepo } from "@/lib/db/repos/cart";
import { ordersRepo } from "@/lib/db/repos/orders";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
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

  // Trust boundary: never bill the client-submitted shipping price. Re-derive
  // the valid options server-side from the cart subtotal + the store's
  // configured rates, then match the customer's chosen option by id. This
  // stops a tampered request from setting an arbitrary (e.g. zero) shipping
  // price, and ensures "free shipping" only applies when the threshold is met.
  const settings = await siteSettingsRepo.get();
  const validOptions = getShippingOptions(subtotalPaise, settings.shipping);
  const chosen = validOptions.find((o) => o.id === input.shippingOption.id);
  if (!chosen) {
    throw new Error("That shipping option isn't available for this order.");
  }
  const shippingPaise = chosen.pricePaise;
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
    // Persist the server-validated option, not the client's copy.
    shippingOption: chosen,
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
