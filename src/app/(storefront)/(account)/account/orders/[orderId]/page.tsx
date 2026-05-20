import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, MapPin, Package, Receipt, Truck, Wallet } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ordersRepo } from "@/lib/db/repos/orders";
import { formatRupees } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/account/OrderStatusTimeline";
import { CartSummary } from "@/components/storefront/CartSummary";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=/account/orders/${orderId}`);
  const order = await ordersRepo.getById(orderId);
  if (!order || order.userId !== user.id) notFound();

  const placed = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const shortId = order.id.replace(/^ord_/, "").slice(0, 8).toUpperCase();

  return (
    <div className="flex min-w-0 flex-col gap-5 sm:gap-7 md:gap-9">
      {/* ── Back link ── */}
      <Link
        href="/account/orders"
        className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500 transition hover:text-ink-900 sm:text-[11px]"
      >
        <ChevronLeft className="h-3 w-3" />
        All orders
      </Link>

      {/* ── Header ── */}
      <header className="flex min-w-0 flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-xs">
          Order #{shortId} · Placed {placed}
        </span>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="font-display text-lg leading-tight text-ink-900 sm:text-2xl md:text-3xl">
            {order.items.length === 1
              ? order.items[0]?.productName
              : `${order.items.length} sarees`}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
      </header>

      <div className="grid gap-5 sm:gap-7 md:grid-cols-[2fr_1fr] md:gap-8">
        {/* ── Left column ── */}
        <div className="flex min-w-0 flex-col gap-5 sm:gap-7">
          {/* Status timeline */}
          <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-7">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <header className="mb-5 flex items-center gap-3 sm:mb-7">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
                <Truck className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                  Tracking
                </span>
                <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
                  Status
                </h2>
              </div>
            </header>
            <OrderStatusTimeline status={order.status} />
          </section>

          {/* Items */}
          <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-7">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <header className="mb-4 flex items-center gap-3 sm:mb-5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
                <Package className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                  In this order
                </span>
                <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
                  Items
                </h2>
              </div>
            </header>
            <ul className="flex flex-col divide-y divide-ink-500/10">
              {order.items.map((it) => (
                <li
                  key={it.variantSku}
                  className="flex min-w-0 items-start gap-3 py-3.5 sm:gap-4 sm:py-4"
                >
                  <Link
                    href={`/product/${it.productSlug}`}
                    className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-ink-900 sm:h-20 sm:w-16"
                  >
                    {it.imageUrl && (
                      <Image
                        src={it.imageUrl}
                        alt={it.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-1">
                    <Link
                      href={`/product/${it.productSlug}`}
                      className="truncate font-display text-sm leading-tight text-ink-900 transition hover:text-accent-primary sm:text-base"
                    >
                      {it.productName}
                    </Link>
                    <span className="truncate text-[10px] uppercase tracking-[0.18em] text-ink-500 sm:text-xs">
                      {it.variantLabel} · Qty {it.quantity}
                    </span>
                    <span className="mt-0.5 text-sm font-semibold tabular-nums text-ink-900 sm:text-base">
                      {formatRupees(it.lineTotalPaise)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-5 sm:gap-7">
          {/* Summary */}
          <CartSummary
            subtotalPaise={order.subtotalPaise}
            shippingPaise={order.shippingPaise}
            taxPaise={order.taxPaise}
            totalPaise={order.totalPaise}
          />

          {/* Shipping to */}
          <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-5 md:p-6">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <header className="mb-4 flex items-center gap-3 sm:mb-5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
                <MapPin className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                  Delivery
                </span>
                <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
                  Shipping to
                </h2>
              </div>
            </header>
            <div className="flex flex-col gap-0.5 text-[12px] leading-relaxed text-ink-700 sm:text-sm">
              <span className="font-medium text-ink-900">{order.shippingAddress.fullName}</span>
              <span>
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              </span>
              <span>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.pincode}
              </span>
              <span className="text-ink-500">{order.shippingAddress.phone}</span>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink-900/[0.04] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-ink-700 sm:text-[9px] sm:tracking-[0.14em]">
              <Truck className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden />
              {order.shippingOption.name} · {order.shippingOption.etaDays} business days
            </p>
          </section>

          {/* Payment */}
          <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-5 md:p-6">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <header className="mb-4 flex items-center gap-3 sm:mb-5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
                <Wallet className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                  Method
                </span>
                <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
                  Payment
                </h2>
              </div>
            </header>
            <div className="flex flex-col gap-1 text-[12px] sm:text-sm">
              <span className="font-medium text-ink-900">
                {order.paymentMethod === "cod" ? "Cash on delivery" : "Online (Razorpay)"}
              </span>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ink-900/[0.04] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-ink-700 sm:text-[9px] sm:tracking-[0.14em]">
                <Receipt className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden />
                {order.paymentStatus}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
