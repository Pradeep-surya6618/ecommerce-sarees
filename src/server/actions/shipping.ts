"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { computeSubtotalPaise } from "@/lib/cart/totals";
import { cartRepo } from "@/lib/db/repos/cart";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { computeCartWeightKg, resolveShippingOptions } from "@/lib/shipping/resolve";
import type { PaymentMethod, ShippingOption } from "@/types/domain";

export type ShippingRatesResult =
  | { ok: true; options: ShippingOption[] }
  | { ok: false; error: string };

export interface ShippingRatesInput {
  deliveryPincode: string;
  paymentMethod?: PaymentMethod;
}

// Fetches the shipping options for the customer's pincode. Subtotal and weight
// are recomputed from the server-side cart — never trusted from the client.
// Always returns options (live Shiprocket rates, or flat fallback).
export async function getShippingRatesAction(
  input: ShippingRatesInput,
): Promise<ShippingRatesResult> {
  const pincode = input.deliveryPincode.trim();
  if (!/^\d{6}$/.test(pincode)) {
    return { ok: false, error: "Enter a valid 6-digit pincode." };
  }

  // Load the same cart the order will be placed against.
  const user = await getCurrentUser();
  let cart;
  if (user) {
    cart = await cartRepo.getOrCreateForUser(user.id);
  } else {
    const guestSessionId = await getGuestSessionId();
    cart = guestSessionId ? await cartRepo.getOrCreateForGuestSession(guestSessionId) : null;
  }
  if (!cart || cart.items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const settings = await siteSettingsRepo.get();
  const subtotalPaise = computeSubtotalPaise(cart.items);
  const weightKg = computeCartWeightKg(cart.items);

  try {
    const options = await resolveShippingOptions({
      deliveryPincode: pincode,
      subtotalPaise,
      weightKg,
      settings: settings.shipping,
      cod: input.paymentMethod === "cod",
    });
    return { ok: true, options };
  } catch {
    return { ok: false, error: "Couldn't fetch shipping rates. Please try again." };
  }
}
