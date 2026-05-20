import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Package } from "lucide-react";
import { formatRupees } from "@/lib/money";
import type { Order } from "@/types/domain";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrderCard({ order }: { order: Order }) {
  const placed = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const preview = order.items.slice(0, 4);
  const remaining = order.items.length - preview.length;
  const shortId = order.id.replace(/^ord_/, "");

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="group relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-3.5 transition hover:border-accent-primary/30 hover:shadow-sm sm:gap-4 sm:p-5"
    >
      {/* Top brass hairline reveals on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />

      {/* ── Header ── */}
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
            <Package className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
              Order #{shortId.slice(0, 6).toUpperCase()}
            </span>
            <span className="truncate font-display text-sm leading-tight text-ink-900 sm:text-base">
              Placed {placed}
            </span>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      {/* ── Thumbnails ── */}
      <div className="flex min-w-0 items-center gap-2 border-t border-ink-500/10 pt-3 sm:gap-3 sm:pt-4">
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {preview.map((it, idx) => (
            <div
              key={`${it.variantSku}-${idx}`}
              className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-ink-900 sm:h-14 sm:w-12"
            >
              {it.imageUrl && (
                <Image
                  src={it.imageUrl}
                  alt={it.productName}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              )}
            </div>
          ))}
          {remaining > 0 && (
            <span className="inline-flex h-12 w-10 shrink-0 items-center justify-center rounded-md border border-ink-500/15 bg-bg-base/60 text-[11px] font-semibold text-ink-700 sm:h-14 sm:w-12 sm:text-xs">
              +{remaining}
            </span>
          )}
        </div>
        <div className="ml-auto hidden text-right sm:flex sm:flex-col sm:gap-0.5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink-500">Total</span>
          <span className="font-display text-lg tabular-nums text-accent-primary">
            {formatRupees(order.totalPaise)}
          </span>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="flex items-center justify-between gap-3 border-t border-ink-500/10 pt-3">
        <span className="text-[11px] uppercase tracking-[0.18em] text-ink-500 sm:text-xs">
          {order.items.length} {order.items.length === 1 ? "item" : "items"}
          {" · "}
          {order.paymentMethod === "cod" ? "COD" : "Online"}
        </span>
        {/* Mobile total (desktop shows it above) + arrow */}
        <span className="flex items-center gap-2">
          <span className="font-display text-base tabular-nums text-accent-primary sm:hidden">
            {formatRupees(order.totalPaise)}
          </span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink-900/[0.04] text-ink-500 transition group-hover:bg-accent-primary group-hover:text-white sm:h-8 sm:w-8">
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
          </span>
        </span>
      </footer>
    </Link>
  );
}
