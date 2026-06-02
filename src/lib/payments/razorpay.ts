import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// Razorpay client — just the read-and-verify pieces we need for the checkout
// flow. Order creation + payment signature verification + webhook signature
// verification. Refunds/captures land in a later phase.
const BASE = "https://api.razorpay.com/v1";

export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

function authHeader(): string {
  // Razorpay uses HTTP Basic with key_id:key_secret.
  const creds = `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`;
  return `Basic ${Buffer.from(creds, "utf8").toString("base64")}`;
}

export interface CreateRazorpayOrderInput {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Create an order on Razorpay's side and get back its order id. The id (plus
 * the public key) is what the client passes to checkout.js to open the modal.
 * Razorpay takes amount in minor units (paise) — exactly what we already store.
 */
export async function createRazorpayOrder(input: CreateRazorpayOrderInput): Promise<RazorpayOrder> {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing).");
  }
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: input.currency,
      receipt: input.receipt,
      // Forward our order id so we can correlate webhooks → our orders.
      notes: input.notes,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    logger.error({ status: res.status, body: body.slice(0, 500) }, "Razorpay order create failed");
    throw new Error(`Razorpay order create failed (HTTP ${res.status}).`);
  }
  const json = (await res.json()) as RazorpayOrder;
  return json;
}

export interface VerifyPaymentSignatureInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

/**
 * Verify the signature Razorpay sent back to the client after a successful
 * payment. Razorpay's contract: signature = HMAC_SHA256(order_id|payment_id,
 * key_secret). We compare in constant time to dodge timing-attack leaks.
 */
export function verifyPaymentSignature(input: VerifyPaymentSignatureInput): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");
  return safeEqualHex(expected, input.razorpaySignature);
}

/**
 * Verify a webhook payload's authenticity using the webhook secret you set
 * when creating the webhook in the Razorpay dashboard (a separate secret from
 * the API key secret). HMAC is computed over the raw request body.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

function safeEqualHex(a: string, b: string): boolean {
  // Buffer.from on different-length inputs makes timingSafeEqual throw — bail
  // out cheaply when lengths don't match. Not a timing leak: an attacker knows
  // the expected length anyway (it's fixed at 64 hex chars for SHA-256).
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}
