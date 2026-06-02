import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Check,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import { ordersRepo } from "@/lib/db/repos/orders";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { formatRupees } from "@/lib/money";
import { OrderStatusTimeline } from "@/components/account/OrderStatusTimeline";
import { Container } from "@/components/ui/Container";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata = {
  title: "Order confirmed · Saree Store",
};

const PAYMENT_LABEL: Record<string, { label: string; description: string }> = {
  razorpay: {
    label: "Paid online",
    description: "Settled securely via Razorpay.",
  },
  cod: {
    label: "Cash on delivery",
    description: "Pay our courier when your order arrives.",
  },
};

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;
  const [order, settings] = await Promise.all([
    ordersRepo.getById(orderId),
    siteSettingsRepo.get(),
  ]);
  if (!order) notFound();

  const firstName = order.shippingAddress.fullName.trim().split(/\s+/)[0] || "there";
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const paymentMeta = PAYMENT_LABEL[order.paymentMethod] ?? {
    label: order.paymentMethod,
    description: "Payment captured.",
  };
  const supportEmail = settings.storeProfile.email || "hello@sareestore.in";
  const supportPhone = settings.storeProfile.phone;

  return (
    <div className="relative">
      {/* Soft radial wash behind the hero — pale lavender → primary → bg-base.
          Root must NOT use `overflow-hidden` — that would break `sticky` on
          the order-summary aside below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_at_top,_rgba(91,58,138,0.18),_rgba(184,160,100,0.06)_45%,_transparent_70%)]"
      />

      <Container size="lg" className="px-4 py-8 sm:px-6 sm:py-12 md:py-14">
        {/* ── Hero ── */}
        <section className="flex flex-col items-center text-center">
          {/* Solid green check disc + two soft halo rings via box-shadow so
              the colour reads clearly on the lavender backdrop (opacity
              layers blended into the bg and looked muted). */}
          <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-success shadow-[0_0_0_10px_rgba(26,122,58,0.18),0_0_0_20px_rgba(26,122,58,0.08)] sm:h-24 sm:w-24">
            <span className="order-step-pop relative inline-flex">
              <Check className="h-9 w-9 text-white sm:h-11 sm:w-11" strokeWidth={3} />
            </span>
          </div>

          <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-gold sm:text-xs">
            <Sparkles className="h-3 w-3" />
            Order placed
          </span>

          <h1 className="mt-3 font-display text-2xl leading-tight text-ink-900 sm:text-4xl md:text-5xl">
            Thank you, {firstName}.
          </h1>

          <p className="mt-3 max-w-xl text-xs leading-relaxed text-ink-700 sm:text-sm">
            Your order is confirmed. A receipt and tracking updates will land in{" "}
            <span className="font-medium text-ink-900">{order.shippingAddress.email}</span> shortly.
          </p>

          {/* Order id pill */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink-500/15 bg-bg-elevated/80 px-3 py-1.5 text-[11px] text-ink-700 shadow-sm backdrop-blur-sm sm:text-xs">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-accent-gold sm:text-[10px]">
              Order
            </span>
            <span className="font-mono tabular-nums text-ink-900">{order.id}</span>
          </div>
        </section>

        {/* ── Brass hairline separator ── */}
        <div
          aria-hidden
          className="mx-auto mt-10 h-px max-w-3xl bg-gradient-to-r from-transparent via-accent-gold/50 to-transparent sm:mt-12"
        />

        {/* ── Body grid ── */}
        <section className="mt-8 grid gap-6 sm:mt-10 md:grid-cols-[2fr_1fr] md:gap-8">
          {/* ── Left column ── */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* Delivery card */}
            <article className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-5 shadow-card sm:p-6">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
              />
              <header className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                  <Truck className="h-[18px] w-[18px]" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold">
                    Delivery
                  </span>
                  <h2 className="font-display text-lg leading-tight text-ink-900 sm:text-xl">
                    {order.shippingOption.name}
                  </h2>
                </div>
              </header>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-700 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Estimated in {order.shippingOption.etaDays}{" "}
                  {order.shippingOption.etaDays === 1 ? "business day" : "business days"}
                </span>
                {order.shippingOption.pricePaise === 0 ? (
                  <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-success">
                    Free
                  </span>
                ) : null}
              </div>

              <div className="mt-5 border-t border-ink-500/10 pt-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
                  <address className="flex flex-col gap-0.5 text-xs not-italic leading-relaxed text-ink-700 sm:text-sm">
                    <span className="font-semibold text-ink-900">
                      {order.shippingAddress.fullName}
                    </span>
                    <span>
                      {order.shippingAddress.line1}
                      {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                    </span>
                    <span>
                      {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                      {order.shippingAddress.pincode}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-ink-500">
                      <Phone className="h-3 w-3" /> {order.shippingAddress.phone}
                    </span>
                  </address>
                </div>
              </div>
            </article>

            {/* Items card */}
            <article className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-5 shadow-card sm:p-6">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
              />
              <header className="mb-4 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                  <ShoppingBag className="h-[18px] w-[18px]" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold">
                    In the box
                  </span>
                  <h2 className="font-display text-lg leading-tight text-ink-900 sm:text-xl">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </h2>
                </div>
              </header>

              <ul className="flex flex-col divide-y divide-ink-500/10">
                {order.items.map((item) => (
                  <li
                    key={item.variantSku}
                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <Link
                      href={`/p/${item.productSlug}`}
                      className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-ink-500/5 ring-1 ring-ink-500/10 transition hover:ring-accent-primary/40 sm:h-28 sm:w-24"
                    >
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="(min-width: 640px) 96px, 80px"
                          className="object-cover"
                        />
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                      <Link
                        href={`/p/${item.productSlug}`}
                        className="font-display text-base leading-tight text-ink-900 transition hover:text-accent-primary sm:text-lg"
                      >
                        {item.productName}
                      </Link>
                      <span className="text-[11px] text-ink-500 sm:text-xs">
                        {item.variantLabel} · Qty {item.quantity}
                      </span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm font-semibold tabular-nums text-ink-900 sm:text-base">
                          {formatRupees(item.lineTotalPaise)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[11px] text-ink-500 sm:text-xs">
                            ({formatRupees(item.unitPricePaise)} each)
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            {/* What's next — timeline */}
            <article className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-5 shadow-card sm:p-6">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
              />
              <header className="mb-5 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                  <Sparkles className="h-[18px] w-[18px]" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold">
                    {"What's next"}
                  </span>
                  <h2 className="font-display text-lg leading-tight text-ink-900 sm:text-xl">
                    Your order journey
                  </h2>
                </div>
              </header>
              <OrderStatusTimeline status={order.status} />
            </article>
          </div>

          {/* ── Right column (sticky on md+) ──
              Holds just the summary card so its full height (incl. the
              "Continue shopping" button) always fits the viewport — no
              internal scroll needed. The support card moved to a full-width
              row below the grid so it never crowds the CTA out of view. */}
          <aside className="md:sticky md:top-24 md:self-start">
            {/* Summary card */}
            <section className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-5 shadow-card sm:p-6">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
              />
              <header className="mb-4 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                  <Wallet className="h-[18px] w-[18px]" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold">
                    Summary
                  </span>
                  <h2 className="font-display text-lg leading-tight text-ink-900 sm:text-xl">
                    Order summary
                  </h2>
                </div>
              </header>

              <dl className="flex flex-col gap-2 text-xs text-ink-700 sm:text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums text-ink-900">{formatRupees(order.subtotalPaise)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>GST (5%)</dt>
                  <dd className="tabular-nums text-ink-900">{formatRupees(order.taxPaise)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd className="tabular-nums text-ink-900">
                    {order.shippingPaise === 0 ? (
                      <span className="text-success">Free</span>
                    ) : (
                      formatRupees(order.shippingPaise)
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 border-t border-ink-500/10 pt-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-base text-ink-900 sm:text-lg">Total</span>
                  <span className="font-display text-xl tabular-nums text-accent-primary sm:text-2xl">
                    {formatRupees(order.totalPaise)}
                  </span>
                </div>
              </div>

              {/* Payment method row */}
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-ink-500/10 bg-bg-base/60 p-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs font-semibold text-ink-900">{paymentMeta.label}</span>
                  <span className="text-[11px] text-ink-500 sm:text-xs">
                    {paymentMeta.description}
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-5 flex flex-col gap-2.5">
                <Link
                  href={`/account/orders/${order.id}`}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-primary-hover"
                >
                  View order details
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-full border border-ink-500/20 bg-bg-elevated px-5 py-3 text-sm font-medium text-ink-900 transition hover:border-accent-primary/40 hover:bg-bg-base"
                >
                  Continue shopping
                </Link>
              </div>
            </section>
          </aside>
        </section>

        {/* ── Support row (full-width, below the grid) ──
            Lives outside the sticky aside so the summary card's CTAs never
            get clipped on shorter viewports. Wide layout reads more like a
            premium footer note than a cramped sidebar block. */}
        <section className="mt-8 rounded-2xl border border-ink-500/10 bg-bg-base/60 px-5 py-5 sm:mt-10 sm:px-7 sm:py-6 md:flex md:items-center md:justify-between md:gap-8">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold">
              Need a hand?
            </span>
            <p className="text-xs leading-relaxed text-ink-700 sm:text-sm">
              Our team is here for anything you need — fitting, fabric, or shipping queries.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm md:mt-0">
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 text-ink-900 transition hover:text-accent-primary"
            >
              <Mail className="h-3.5 w-3.5 text-ink-500" /> {supportEmail}
            </a>
            {supportPhone && (
              <a
                href={`tel:${supportPhone}`}
                className="inline-flex items-center gap-2 text-ink-900 transition hover:text-accent-primary"
              >
                <Phone className="h-3.5 w-3.5 text-ink-500" /> {supportPhone}
              </a>
            )}
          </div>
        </section>
      </Container>
    </div>
  );
}
