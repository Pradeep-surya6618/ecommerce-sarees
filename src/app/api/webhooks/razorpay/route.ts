import { NextResponse } from "next/server";
import { ordersRepo } from "@/lib/db/repos/orders";
import { logger } from "@/lib/logger";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

// Razorpay webhook receiver. Razorpay POSTs JSON here on payment.captured,
// payment.failed, etc. This route is the resilient half of the integration —
// the inline `verifyRazorpayPaymentAction` is the happy path; webhooks make
// sure orders still flip to paid when the customer closes the tab, loses
// network mid-redirect, or otherwise never hits the verify action.
//
// Configure in Razorpay dashboard → Settings → Webhooks:
//   URL: https://<your-host>/api/webhooks/razorpay
//   Events: payment.captured, payment.failed
//   Webhook secret: paste into RAZORPAY_WEBHOOK_SECRET (in .env.local + prod env)

interface RazorpayWebhookEvent {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        notes?: Record<string, string>;
      };
    };
  };
}

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  // Need the raw body (exact bytes) for HMAC verification — Next gives us
  // text() which is the body as a string, matching Razorpay's signing input.
  const rawBody = await request.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn({ signaturePresent: Boolean(signature) }, "Razorpay webhook signature invalid");
    // Don't leak whether the secret/event is plausible; just reject.
    return new NextResponse("invalid signature", { status: 401 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  // The order id WE issued — set as a note when we created the Razorpay order.
  const ourOrderId = payment?.notes?.our_order_id;
  const razorpayPaymentId = payment?.id;

  // Always 200 on signature-valid but unhandled events so Razorpay doesn't
  // retry forever. Log and move on.
  if (!ourOrderId || !razorpayPaymentId) {
    logger.info({ event: event.event }, "Razorpay webhook: no order correlation, skipping");
    return NextResponse.json({ ok: true });
  }

  try {
    if (event.event === "payment.captured") {
      // markPaid is idempotent — if the inline verify already ran, this is a no-op.
      await ordersRepo.markPaid(ourOrderId, razorpayPaymentId);
    } else if (event.event === "payment.failed") {
      await ordersRepo.markPaymentFailed(ourOrderId);
    }
  } catch (err) {
    logger.error({ err, event: event.event, ourOrderId }, "Razorpay webhook handler threw");
    // 500 → Razorpay retries; useful for transient errors.
    return new NextResponse("handler error", { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
