"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Search, UsersRound, X } from "lucide-react";
import { formatRupees } from "@/lib/money";
import { Tooltip } from "@/components/admin/Tooltip";
import { Badge } from "@/components/ui/Badge";
import type { User } from "@/types/domain";

export interface CustomerRow extends User {
  orderCount: number;
  lifetimePaise: number;
}

interface Props {
  rows: CustomerRow[];
  totalCount: number;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export function CustomersListClient({ rows, totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const initialQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);

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

  const hasQuery = Boolean(query);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Customers</h1>
            <p className="text-[11px] text-ink-700 sm:text-sm">
              {hasQuery
                ? `${rows.length} of ${totalCount} ${totalCount === 1 ? "customer" : "customers"}`
                : `${totalCount} ${totalCount === 1 ? "customer" : "customers"}`}
            </p>
          </div>
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-ink-500/20 px-3 text-xs font-medium text-ink-700 transition hover:border-accent-primary hover:text-accent-primary sm:h-10 sm:px-4"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear search</span>
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
            placeholder="Search by name or email…"
            className="autofill-on-light h-10 w-full rounded-full border border-ink-500/15 bg-bg-elevated pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary focus:bg-white sm:h-11"
          />
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-500/10 text-ink-500">
            <UsersRound className="h-5 w-5" />
          </div>
          <p className="text-sm text-ink-500">
            {hasQuery ? `No customers match "${query}".` : "No customers yet."}
          </p>
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink-500/20 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-accent-primary hover:text-accent-primary"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated shadow-card md:block">
            <table className="min-w-full divide-y divide-ink-500/10 text-sm">
              <thead className="bg-bg-base/50">
                <tr>
                  <th scope="col" className="w-[64px] px-4 py-3" />
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Orders
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Lifetime spend
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Status
                  </th>
                  <th scope="col" className="w-[60px] px-4 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-500/10">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/admin/customers/${r.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/admin/customers/${r.id}`);
                      }
                    }}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open ${r.fullName}`}
                    className="group cursor-pointer transition hover:bg-bg-base/50 focus-visible:bg-bg-base/50 focus-visible:outline-none"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary/15 to-accent-gold/15 font-display text-sm font-semibold text-accent-primary">
                        {initialsOf(r.fullName)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-ink-900 transition group-hover:text-accent-primary"
                      >
                        {r.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{r.email}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                      {r.orderCount}
                    </td>
                    <td className="px-4 py-3 text-right font-display text-base tabular-nums text-ink-900">
                      {formatRupees(r.lifetimePaise)}
                    </td>
                    <td className="px-4 py-3">
                      {r.blocked ? (
                        <Badge tone="danger">Blocked</Badge>
                      ) : (
                        <span className="text-ink-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip label="Open customer" side="left" hideOnMobile>
                        <Link
                          href={`/admin/customers/${r.id}`}
                          aria-label={`Open ${r.fullName}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-ink-500/15 bg-bg-elevated text-ink-700 transition group-hover:border-accent-primary group-hover:bg-accent-primary group-hover:text-white"
                        >
                          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                        </Link>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/customers/${r.id}`}
                  className="flex items-center gap-2.5 rounded-xl border border-ink-500/10 bg-bg-elevated p-2.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elev"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary/15 to-accent-primary/5 text-xs font-semibold text-accent-primary">
                    {initialsOf(r.fullName)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium leading-tight text-ink-900">
                        {r.fullName}
                      </span>
                      {r.blocked && (
                        <Badge
                          tone="danger"
                          className="!px-1.5 !py-0.5 !text-[9px] !tracking-wider"
                        >
                          Blocked
                        </Badge>
                      )}
                    </div>
                    <span className="truncate text-[10px] text-ink-500">{r.email}</span>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-500">
                      <span>
                        {r.orderCount} {r.orderCount === 1 ? "order" : "orders"}
                      </span>
                      <span>·</span>
                      <span className="font-semibold tabular-nums normal-case text-ink-900">
                        {formatRupees(r.lifetimePaise)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
