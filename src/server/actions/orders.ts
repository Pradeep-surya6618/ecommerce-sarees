"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ensureGuestSessionId } from "@/lib/cart/guest-session";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise } from "@/lib/cart/totals";
import { cartRepo } from "@/lib/db/repos/cart";
import { ordersRepo } from "@/lib/db/repos/orders";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { env } from "@/lib/env";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/payments/razorpay";
import { computeCartWeightKg, resolveShippingOptions } from "@/lib/shipping/resolve";
import type { Address, OrderItem, PaymentMethod, ShippingOption } from "@/types/domain";

export interface PlaceOrderInput {
  shippingAddress: Address;
  shippingOption: ShippingOption;
  paymentMethod: PaymentMethod;
  customerNotes?: string;
}

// COD orders redirect inline (action throws NEXT_REDIRECT, like before).
// Razorpay orders return a payload so the client can open the checkout modal —
// the order is persisted in DDB as `pending_payment` until the signature is
// verified by `verifyRazorpayPaymentAction`.
export type PlaceOrderResult =
  | {
      ok: true;
      kind: "razorpay";
      orderId: string;
      razorpayOrderId: string;
      keyId: string;
      amountPaise: number;
      currency: string;
      customerEmail: string;
      customerName: string;
      customerPhone: string;
    }
  | { ok: false; error: string };

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
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
  // the valid options server-side via the SAME resolver checkout used (live
  // Shiprocket rates or flat fallback), then match the customer's chosen
  // option by id and bill the server's price. Stops a tampered request from
  // setting an arbitrary (e.g. zero) shipping price, and ensures "free
  // shipping" only applies when the threshold is met.
  const settings = await siteSettingsRepo.get();
  const validOptions = await resolveShippingOptions({
    deliveryPincode: input.shippingAddress.pincode,
    subtotalPaise,
    weightKg: computeCartWeightKg(cart.items),
    settings: settings.shipping,
    cod: input.paymentMethod === "cod",
  });
  const chosen = validOptions.find((o) => o.id === input.shippingOption.id);
  if (!chosen) {
    throw new Error("That shipping option isn't available for this order.");
  }
  const shippingPaise = chosen.pricePaise;
  const totalPaise = computeTotalPaise({ subtotalPaise, taxPaise, shippingPaise });

  // ── Razorpay path: persist our order first to get a stable id, then create
  // the gateway order with that id as receipt/notes (so webhooks can correlate
  // back), then write the Razorpay order id onto our row. Cart stays put until
  // the payment verifies, so an abandoned checkout doesn't lose items. ──
  if (input.paymentMethod === "razorpay") {
    if (!isRazorpayConfigured()) {
      return { ok: false, error: "Online payments aren't configured. Please choose COD." };
    }
    try {
      const order = await ordersRepo.create({
        userId: user?.id ?? null,
        guestSessionId: user ? null : cart.guestSessionId,
        items,
        subtotalPaise,
        shippingPaise,
        taxPaise,
        totalPaise,
        paymentMethod: "razorpay",
        shippingAddress: input.shippingAddress,
        shippingOption: chosen,
        customerNotes: input.customerNotes,
        initialStatus: "pending_payment",
      });
      const rzpOrder = await createRazorpayOrder({
        amountPaise: totalPaise,
        currency: "INR",
        receipt: order.id,
        notes: { our_order_id: order.id },
      });
      await ordersRepo.setRazorpayOrderId(order.id, rzpOrder.id);
      return {
        ok: true,
        kind: "razorpay",
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        keyId: env.RAZORPAY_KEY_ID!,
        amountPaise: totalPaise,
        currency: "INR",
        customerEmail: input.shippingAddress.email,
        customerName: input.shippingAddress.fullName,
        customerPhone: input.shippingAddress.phone,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't start the online payment.";
      return { ok: false, error: msg };
    }
  }

  // ── COD path: confirm immediately, clear cart, redirect to success. ──
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

export interface VerifyRazorpayPaymentInput {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// Called by the client right after the Razorpay modal returns success. We
// re-verify the signature server-side (the only authoritative proof), mark
// the order paid, clear the cart, and redirect to the success page. The
// webhook is the safety net for cases where this never gets called (user
// closes the tab before redirect, network drops, etc.).
export async function verifyRazorpayPaymentAction(
  input: VerifyRazorpayPaymentInput,
): Promise<void> {
  // Lazy import to keep this action small + avoid loading crypto on the COD path.
  const { verifyPaymentSignature } = await import("@/lib/payments/razorpay");
  const ok = verifyPaymentSignature({
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpaySignature: input.razorpaySignature,
  });
  if (!ok) {
    // Signature mismatch → don't trust this response. Flag the order so
    // admin/customer can see it as failed (but don't redirect to success).
    await ordersRepo.markPaymentFailed(input.orderId);
    throw new Error("Payment signature didn't verify. Please try again.");
  }

  // Confirm the order matches the Razorpay order id we issued (defends
  // against a malicious client swapping in a different order's payment).
  const existing = await ordersRepo.getById(input.orderId);
  if (!existing || existing.razorpayOrderId !== input.razorpayOrderId) {
    throw new Error("This payment doesn't match the order.");
  }

  await ordersRepo.markPaid(input.orderId, input.razorpayPaymentId);

  // Clear the cart now that payment is confirmed.
  const user = await getCurrentUser();
  if (user) {
    await cartRepo.clearAsUser(user.id);
  } else {
    const guestSessionId = await ensureGuestSessionId();
    await cartRepo.clear(guestSessionId);
  }
  revalidatePath("/", "layout");
  redirect(`/checkout/success/${input.orderId}`);
}
