"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Package, Search, ShoppingBag, X } from "lucide-react";
import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { Tooltip } from "@/components/admin/Tooltip";
import type { Order } from "@/types/domain";

const STATUS_PILLS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

interface Props {
  orders: Order[];
  totalCount: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OrdersListClient({ orders, totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const initialQuery = params.get("q") ?? "";
  const status = params.get("status") ?? "";
  const [query, setQuery] = useState(initialQuery);

  // Debounce search updates to the URL so each keystroke doesn't navigate.
  useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const id = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (query) next.set("q", query);
      else next.delete("q");
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 250);
    return () => window.clearTimeout(id);
  }, [query, params, pathname, router]);

  function setStatus(next: string) {
    const p = new URLSearchParams(params);
    if (next) p.set("status", next);
    else p.delete("status");
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function clearFilters() {
    setQuery("");
    router.push(pathname);
  }

  const hasActiveFilters = Boolean(status) || Boolean(query);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Orders</h1>
            <p className="text-[11px] text-ink-700 sm:text-sm">
              {hasActiveFilters
                ? `${orders.length} of ${totalCount} ${totalCount === 1 ? "order" : "orders"}`
                : `${totalCount} ${totalCount === 1 ? "order" : "orders"}`}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-ink-500/20 px-3 text-xs font-medium text-ink-700 transition hover:border-accent-primary hover:text-accent-primary sm:h-10 sm:px-4"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear filters</span>
              <span className="sm:hidden">Clear</span>
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order id, name, or email…"
            className="autofill-on-light h-10 w-full rounded-full border border-ink-500/15 bg-bg-elevated pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary focus:bg-white sm:h-11"
          />
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
          {STATUS_PILLS.map((pill) => {
            const active = (status || "") === pill.value;
            return (
              <button
                key={pill.value || "all"}
                type="button"
                onClick={() => setStatus(pill.value)}
                className={clsx(
                  "inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full border px-3 text-[11px] font-medium transition sm:h-8 sm:text-xs",
                  active
                    ? "border-accent-primary bg-accent-primary text-white shadow-[0_6px_18px_-10px_rgba(91,58,138,0.7)]"
                    : "border-ink-500/15 bg-bg-elevated text-ink-700 hover:border-accent-primary hover:text-accent-primary",
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-500/10 text-ink-500">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <p className="text-sm text-ink-500">
            {hasActiveFilters
              ? "No orders match these filters."
              : "No orders yet — they'll appear here when customers check out."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink-500/20 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-accent-primary hover:text-accent-primary"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated shadow-card md:block">
            <table className="min-w-full divide-y divide-ink-500/10 text-sm">
              <thead className="bg-bg-base/50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Order
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Items
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Placed
                  </th>
                  <th scope="col" className="w-[60px] px-4 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-500/10">
                {orders.map((o) => (
                  <tr key={o.id} className="group transition hover:bg-bg-base/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-xs text-ink-900 transition hover:text-accent-primary"
                      >
                        {o.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-ink-900">
                          {o.shippingAddress.fullName}
                        </span>
                        <span className="truncate text-[11px] text-ink-500">
                          {o.shippingAddress.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                      {o.items.length}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink-900">
                      {formatRupees(o.totalPaise)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-700">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Tooltip label="Open order" side="left" hideOnMobile>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          aria-label={`Open order ${o.id}`}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-ink-500/15 bg-bg-elevated text-ink-700 transition hover:border-accent-primary hover:bg-accent-primary/5 hover:text-accent-primary"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center gap-2.5 rounded-xl border border-ink-500/10 bg-bg-elevated p-2.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elev"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
                    <Package className="h-[18px] w-[18px]" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[11px] text-ink-700">{o.id}</span>
                      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink-900">
                        {formatRupees(o.totalPaise)}
                      </span>
                    </div>
                    <span className="truncate text-[13px] font-medium leading-tight text-ink-900">
                      {o.shippingAddress.fullName}
                    </span>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ink-500">
                      <span>{formatDate(o.createdAt)}</span>
                      <span>·</span>
                      <span>
                        {o.items.length} {o.items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
