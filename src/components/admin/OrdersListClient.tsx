"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Search, ShoppingBag, X } from "lucide-react";
import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { Tooltip } from "@/components/admin/Tooltip";
import type { Order } from "@/types/domain";

const STATUS_PILLS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "paid", label: "Paid" },
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
          {/* ── Desktop table card with brass hairline ── */}
          <div className="relative hidden overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated shadow-card md:block">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <table className="min-w-full divide-y divide-ink-500/10 text-sm">
              <thead className="bg-bg-base/50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500"
                  >
                    Order
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500"
                  >
                    Items
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500"
                  >
                    Placed
                  </th>
                  <th scope="col" className="w-[60px] px-4 py-3.5" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-500/10">
                {orders.map((o) => {
                  const initial = o.shippingAddress.fullName.trim().charAt(0).toUpperCase() || "?";
                  return (
                    <tr
                      key={o.id}
                      onClick={() => router.push(`/admin/orders/${o.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/admin/orders/${o.id}`);
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open order ${o.id}`}
                      className="group cursor-pointer transition hover:bg-bg-base/50 focus-visible:bg-bg-base/50 focus-visible:outline-none"
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="inline-flex rounded-md bg-ink-500/5 px-2 py-1 font-mono text-[11px] text-ink-700 transition group-hover:bg-accent-primary/10 group-hover:text-accent-primary"
                        >
                          {o.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary/15 to-accent-gold/15 font-display text-sm font-semibold text-accent-primary">
                            {initial}
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-ink-900">
                              {o.shippingAddress.fullName}
                            </span>
                            <span className="truncate text-[11px] text-ink-500">
                              {o.shippingAddress.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-ink-700">
                        {o.items.length}
                      </td>
                      <td className="px-4 py-3.5 text-right font-display text-base tabular-nums text-ink-900">
                        {formatRupees(o.totalPaise)}
                      </td>
                      <td className="px-4 py-3.5">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink-700">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Tooltip label="Open order" side="left" hideOnMobile>
                          <Link
                            href={`/admin/orders/${o.id}`}
                            aria-label={`Open order ${o.id}`}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-ink-500/15 bg-bg-elevated text-ink-700 transition group-hover:border-accent-primary group-hover:bg-accent-primary group-hover:text-white"
                          >
                            <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                          </Link>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards — tighter, premium hairline ── */}
          <ul className="flex flex-col gap-1.5 md:hidden">
            {orders.map((o) => {
              const initial = o.shippingAddress.fullName.trim().charAt(0).toUpperCase() || "?";
              return (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="relative flex items-center gap-2 overflow-hidden rounded-xl border border-ink-500/10 bg-bg-elevated p-2 shadow-card transition active:scale-[0.99]"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/50 to-transparent"
                    />
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary/15 to-accent-gold/15 font-display text-[13px] font-semibold text-accent-primary">
                      {initial}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-px">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-[10px] text-ink-500">{o.id}</span>
                        <span className="shrink-0 font-display text-[13px] font-semibold tabular-nums text-ink-900">
                          {formatRupees(o.totalPaise)}
                        </span>
                      </div>
                      <span className="truncate text-[12px] font-medium leading-tight text-ink-900">
                        {o.shippingAddress.fullName}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] text-ink-500">
                        <span>{formatDate(o.createdAt)}</span>
                        <span className="text-ink-500/50">·</span>
                        <span>
                          {o.items.length} {o.items.length === 1 ? "item" : "items"}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <OrderStatusBadge
                        status={o.status}
                        className="px-1.5 py-0 text-[9px] tracking-[0.06em]"
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
