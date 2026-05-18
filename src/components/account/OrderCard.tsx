import Image from "next/image";
import Link from "next/link";
import { formatRupees } from "@/lib/money";
import type { Order } from "@/types/domain";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrderCard({ order }: { order: Order }) {
  const placed = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const preview = order.items.slice(0, 3);
  const remaining = order.items.length - preview.length;
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="flex flex-col gap-4 rounded-md border border-ink-500/10 bg-bg-elevated p-5 transition hover:border-ink-900"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase tracking-wide text-ink-500">Order</span>
          <span className="font-medium text-ink-900">{order.id}</span>
          <span className="text-xs text-ink-500">Placed {placed}</span>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>
      <div className="flex items-center gap-3">
        {preview.map((it) => (
          <div
            key={it.variantSku}
            className="relative h-14 w-12 shrink-0 overflow-hidden rounded-sm bg-ink-500/5"
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
        {remaining > 0 && <span className="text-xs text-ink-500">+{remaining} more</span>}
      </div>
      <footer className="flex items-center justify-between">
        <span className="text-sm text-ink-700">
          {order.items.length} {order.items.length === 1 ? "item" : "items"}
        </span>
        <span className="font-semibold tabular-nums text-ink-900">
          {formatRupees(order.totalPaise)}
        </span>
      </footer>
    </Link>
  );
}
