"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Tag } from "lucide-react";
import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import { Tooltip } from "@/components/admin/Tooltip";
import { Badge } from "@/components/ui/Badge";
import type { Coupon } from "@/types/domain";

interface Props {
  coupons: Coupon[];
}

const STATUS_PILLS: { value: "" | "active" | "paused"; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function valueLabel(c: Coupon): string {
  return c.type === "percent" ? `${c.value}% off` : `${formatRupees(c.value)} off`;
}

export function CouponsListClient({ coupons }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | "active" | "paused">("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coupons.filter((c) => {
      if (status && c.status !== status) return false;
      if (!q) return true;
      return c.code.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q);
    });
  }, [coupons, query, status]);

  const hasActiveFilters = Boolean(query) || Boolean(status);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Coupons</h1>
            <p className="text-[11px] text-ink-700 sm:text-sm">
              {hasActiveFilters
                ? `${filtered.length} of ${coupons.length} ${coupons.length === 1 ? "coupon" : "coupons"}`
                : `${coupons.length} ${coupons.length === 1 ? "coupon" : "coupons"}`}
            </p>
          </div>
          <Link
            href="/admin/coupons/new"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-accent-primary px-3 text-xs font-medium text-white shadow-[0_8px_24px_-12px_rgba(91,58,138,0.7)] transition hover:bg-accent-primary-hover sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>New</span>
            <span className="hidden sm:inline">coupon</span>
          </Link>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code or description…"
            className="autofill-on-light h-10 w-full rounded-full border border-ink-500/15 bg-bg-elevated pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary focus:bg-white sm:h-11"
          />
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
          {STATUS_PILLS.map((pill) => {
            const active = status === pill.value;
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

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-500/10 text-ink-500">
            <Tag className="h-5 w-5" />
          </div>
          <p className="text-sm text-ink-500">
            {hasActiveFilters ? "No coupons match these filters." : "No coupons yet."}
          </p>
          {!hasActiveFilters && (
            <Link
              href="/admin/coupons/new"
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
            >
              <Plus className="h-4 w-4" /> New coupon
            </Link>
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
                    Code
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Value
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Used
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Min order
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Expires
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
                {filtered.map((c) => (
                  <tr key={c.code} className="group transition hover:bg-bg-base/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/coupons/${encodeURIComponent(c.code)}`}
                        className="font-mono text-xs font-semibold text-ink-900 transition hover:text-accent-primary"
                      >
                        {c.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{valueLabel(c)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                      {c.maxUses != null ? `${c.usedCount} / ${c.maxUses}` : `${c.usedCount} / ∞`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                      {c.minOrderPaise != null ? formatRupees(c.minOrderPaise) : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{formatDate(c.validTo)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={c.status === "active" ? "success" : "warning"}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip label="Edit coupon" side="left" hideOnMobile>
                        <Link
                          href={`/admin/coupons/${encodeURIComponent(c.code)}`}
                          aria-label={`Edit ${c.code}`}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-ink-500/15 bg-bg-elevated text-ink-700 transition hover:border-accent-primary hover:bg-accent-primary/5 hover:text-accent-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {filtered.map((c) => (
              <li key={c.code}>
                <Link
                  href={`/admin/coupons/${encodeURIComponent(c.code)}`}
                  className="flex items-center gap-2.5 rounded-xl border border-ink-500/10 bg-bg-elevated p-2.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elev"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-gold/15 text-accent-gold">
                    <Tag className="h-[18px] w-[18px]" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[13px] font-semibold text-ink-900">
                        {c.code}
                      </span>
                      <Badge
                        tone={c.status === "active" ? "success" : "warning"}
                        className="!px-1.5 !py-0.5 !text-[9px] !tracking-wider"
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <span className="truncate text-[11px] text-ink-700">{valueLabel(c)}</span>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-500">
                      <span>
                        {c.maxUses != null
                          ? `${c.usedCount}/${c.maxUses} used`
                          : `${c.usedCount} used`}
                      </span>
                      <span>·</span>
                      <span>Exp {formatDate(c.validTo)}</span>
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
