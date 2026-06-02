import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Calendar,
  CreditCard,
  Hash,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { ordersRepo } from "@/lib/db/repos/orders";
import { formatRupees } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/account/OrderStatusTimeline";
import { InternalNotes } from "@/components/admin/InternalNotes";
import { OrderStatusActions } from "@/components/admin/OrderStatusActions";
import { CartSummary } from "@/components/storefront/CartSummary";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

const PAYMENT_LABEL: Record<string, string> = {
  razorpay: "Razorpay",
  cod: "Cash on delivery",
};

function formatPlacedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = await ordersRepo.getById(orderId);
  if (!order) notFound();

  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const paymentLabel = PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-7">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.id },
        ]}
      />

      {/* ── Hero header ── */}
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-xs">
              <Sparkles className="h-3 w-3" />
              Order
            </span>
            <h1 className="mt-1 break-all font-display text-lg leading-tight text-ink-900 sm:break-normal sm:text-xl md:text-2xl">
              {order.id}
            </h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-ink-500 sm:text-xs">
              <Calendar className="h-3 w-3" />
              Placed {formatPlacedAt(order.createdAt)}
            </p>
          </div>
          <div className="shrink-0">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Quick metrics — at-a-glance facts */}
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            {
              label: "Total",
              value: formatRupees(order.totalPaise),
              icon: Wallet,
              display: true,
            },
            { label: "Items", value: String(itemCount), icon: ShoppingBag, display: false },
            { label: "Payment", value: paymentLabel, icon: CreditCard, display: false },
            {
              label: "ETA",
              value: `${order.shippingOption.etaDays}d`,
              icon: Calendar,
              display: false,
            },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="relative overflow-hidden rounded-xl border border-ink-500/10 bg-bg-elevated p-2.5 shadow-card sm:p-3"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/50 to-transparent"
                />
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-8 sm:w-8">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-500 sm:text-[10px]">
                      {m.label}
                    </dt>
                    <dd
                      className={
                        m.display
                          ? "truncate font-display text-base tabular-nums text-ink-900 sm:text-lg"
                          : "truncate text-xs font-medium text-ink-900 sm:text-sm"
                      }
                    >
                      {m.value}
                    </dd>
                  </div>
                </div>
              </div>
            );
          })}
        </dl>
      </header>

      {/* ── Body grid ── */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-[2fr_1fr] md:gap-6">
        {/* ── Left column ── */}
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          {/* Status timeline */}
          <article className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <header className="mb-4 flex items-center gap-2.5 sm:gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
                <Sparkles className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                  Journey
                </span>
                <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
                  Status
                </h2>
              </div>
            </header>
            <OrderStatusTimeline status={order.status} />
          </article>

          {/* Items */}
          <article className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <header className="mb-3 flex items-center gap-2.5 sm:mb-4 sm:gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
                <ShoppingBag className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                  In the box
                </span>
                <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </h2>
              </div>
            </header>
            <ul className="flex flex-col divide-y divide-ink-500/10">
              {order.items.map((it) => (
                <li
                  key={it.variantSku}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4 sm:py-4"
                >
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-ink-500/5 ring-1 ring-ink-500/10 sm:h-20 sm:w-16">
                    {it.imageUrl && (
                      <Image
                        src={it.imageUrl}
                        alt={it.productName}
                        fill
                        sizes="(min-width: 640px) 64px, 48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
                    <span className="truncate font-display text-sm leading-tight text-ink-900 sm:text-base">
                      {it.productName}
                    </span>
                    <span className="text-[11px] text-ink-500 sm:text-xs">
                      {it.variantLabel} · Qty {it.quantity}
                    </span>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-sm font-semibold tabular-nums text-ink-900 sm:text-base">
                        {formatRupees(it.lineTotalPaise)}
                      </span>
                      {it.quantity > 1 && (
                        <span className="text-[10px] text-ink-500 sm:text-xs">
                          ({formatRupees(it.unitPricePaise)} each)
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          {/* Internal notes — owns its own card */}
          <InternalNotes orderId={order.id} notes={order.internalNotes} />
        </div>

        {/* ── Right column (sticky on md+) ──
            Holds Actions / Summary / Customer as a single unit that stays
            pinned 96px below the admin header while the left column (status,
            items, notes) scrolls past. No max-height — the left column is
            normally taller, so sticky pins for the entire scroll and only
            releases at the bottom of the grid. */}
        <div className="flex flex-col gap-4 sm:gap-5 md:sticky md:top-24 md:self-start">
          <OrderStatusActions orderId={order.id} status={order.status} />
          <CartSummary
            subtotalPaise={order.subtotalPaise}
            shippingPaise={order.shippingPaise}
            taxPaise={order.taxPaise}
            totalPaise={order.totalPaise}
          />

          {/* Customer card */}
          <article className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <header className="mb-3 flex items-center gap-2.5 sm:gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
                <User className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                  Customer
                </span>
                <h2 className="truncate font-display text-base leading-tight text-ink-900 sm:text-xl">
                  {order.shippingAddress.fullName}
                </h2>
              </div>
            </header>

            <div className="flex flex-col gap-1.5 text-xs text-ink-700 sm:text-sm">
              <a
                href={`mailto:${order.shippingAddress.email}`}
                className="inline-flex items-center gap-2 transition hover:text-accent-primary"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                <span className="truncate">{order.shippingAddress.email}</span>
              </a>
              <a
                href={`tel:${order.shippingAddress.phone}`}
                className="inline-flex items-center gap-2 transition hover:text-accent-primary"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                {order.shippingAddress.phone}
              </a>
            </div>

            <div className="mt-4 border-t border-ink-500/10 pt-3 sm:pt-4">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                <MapPin className="h-3 w-3" />
                Ship to
              </span>
              <address className="mt-1.5 flex flex-col gap-0.5 text-xs not-italic leading-relaxed text-ink-700 sm:text-sm">
                <span>
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                </span>
                <span>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.pincode}
                </span>
              </address>
            </div>

            {/* Payment row */}
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-ink-500/10 bg-bg-base/60 p-2.5 sm:p-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/15 text-success sm:h-8 sm:w-8">
                <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[11px] font-semibold text-ink-900 sm:text-xs">
                  {paymentLabel}
                </span>
                <span className="text-[10px] text-ink-500 sm:text-[11px]">
                  Payment status: {order.paymentStatus}
                </span>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-ink-500/5 px-2 py-0.5 font-mono text-[9px] text-ink-500 sm:text-[10px]">
                <Hash className="h-2.5 w-2.5" />
                {(order.razorpayPaymentId ?? order.razorpayOrderId ?? "—").slice(-8)}
              </span>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
