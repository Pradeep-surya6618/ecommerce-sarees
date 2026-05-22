"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertCircle, ImagePlus, Pencil, Plus, Search } from "lucide-react";
import { BANNER_LIMITS, countByPlacement, PLACEMENT_LABELS } from "@/lib/admin/banner-limits";
import { clsx } from "@/lib/utils/clsx";
import { Tooltip } from "@/components/admin/Tooltip";
import { Badge } from "@/components/ui/Badge";
import type { Banner } from "@/types/domain";

interface Props {
  banners: Banner[];
}

const PLACEMENT_PILLS: { value: "" | Banner["placement"]; label: string }[] = [
  { value: "", label: "All" },
  { value: "home-hero", label: "Home hero" },
  { value: "home-strip", label: "Home strip" },
  { value: "shop-strip", label: "Shop strip" },
];

export function BannersListClient({ banners }: Props) {
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState<"" | Banner["placement"]>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return banners.filter((b) => {
      if (placement && b.placement !== placement) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        (b.subtitle ?? "").toLowerCase().includes(q) ||
        b.placement.toLowerCase().includes(q)
      );
    });
  }, [banners, query, placement]);

  const hasActiveFilters = Boolean(query) || Boolean(placement);
  const counts = countByPlacement(banners);
  const fullPlacements = (Object.keys(counts) as Banner["placement"][]).filter(
    (p) => counts[p] >= BANNER_LIMITS[p],
  );
  const allFull = fullPlacements.length === 3;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Banners</h1>
            <p className="text-[11px] text-ink-700 sm:text-sm">
              {hasActiveFilters
                ? `${filtered.length} of ${banners.length} ${banners.length === 1 ? "banner" : "banners"}`
                : `${banners.length} ${banners.length === 1 ? "banner" : "banners"} across placements`}
            </p>
          </div>
          {allFull ? (
            <Tooltip
              label="All placements are full. Delete a banner to add a new one."
              side="left"
              hideOnMobile
            >
              <span
                aria-disabled
                className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-full border border-ink-500/20 bg-bg-elevated px-3 text-xs font-medium text-ink-500 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Full</span>
              </span>
            </Tooltip>
          ) : (
            <Link
              href="/admin/banners/new"
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-accent-primary px-3 text-xs font-medium text-white shadow-[0_8px_24px_-12px_rgba(91,58,138,0.7)] transition hover:bg-accent-primary-hover sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>New</span>
              <span className="hidden sm:inline">banner</span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {(Object.keys(BANNER_LIMITS) as Banner["placement"][]).map((p) => {
            const used = counts[p];
            const max = BANNER_LIMITS[p];
            const isFull = used >= max;
            return (
              <div
                key={p}
                className={clsx(
                  "flex flex-col gap-0.5 rounded-xl border px-2.5 py-1.5 transition sm:px-3 sm:py-2",
                  isFull
                    ? "border-warning/30 bg-warning/[0.06]"
                    : "border-ink-500/15 bg-bg-elevated",
                )}
              >
                <span className="truncate text-[9px] font-medium uppercase tracking-wider text-ink-500 sm:text-[10px]">
                  {PLACEMENT_LABELS[p]}
                </span>
                <span
                  className={clsx(
                    "font-mono text-[11px] tabular-nums sm:text-xs",
                    isFull ? "font-semibold text-warning" : "text-ink-900",
                  )}
                >
                  {used} / {max}
                  {isFull && <span className="ml-1 text-[9px] uppercase tracking-wider">Full</span>}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, subtitle or placement…"
            className="autofill-on-light h-10 w-full rounded-full border border-ink-500/15 bg-bg-elevated pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary focus:bg-white sm:h-11"
          />
        </div>

        {fullPlacements.length > 0 && (
          <p className="flex items-start gap-2 rounded-xl border border-accent-gold/30 bg-accent-gold/[0.06] px-3 py-2 text-[11px] text-ink-700 sm:px-4 sm:py-3 sm:text-xs">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-gold" />
            <span>
              {allFull
                ? "All placements are full. Delete a banner from any placement to add a new one."
                : `${fullPlacements.map((p) => PLACEMENT_LABELS[p]).join(", ")} ${fullPlacements.length === 1 ? "is" : "are"} full — delete one to add another there.`}
            </span>
          </p>
        )}

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
          {PLACEMENT_PILLS.map((pill) => {
            const active = placement === pill.value;
            return (
              <button
                key={pill.value || "all"}
                type="button"
                onClick={() => setPlacement(pill.value)}
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
            <ImagePlus className="h-5 w-5" />
          </div>
          <p className="text-sm text-ink-500">
            {hasActiveFilters ? "No banners match these filters." : "No banners yet."}
          </p>
          {!hasActiveFilters && (
            <Link
              href="/admin/banners/new"
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
            >
              <Plus className="h-4 w-4" /> New banner
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated shadow-card md:block">
            <table className="min-w-full divide-y divide-ink-500/10 text-sm">
              <thead className="bg-bg-base/50">
                <tr>
                  <th scope="col" className="w-[88px] px-4 py-3" />
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Title
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Placement
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Order
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
                {filtered.map((b) => (
                  <tr key={b.id} className="group transition hover:bg-bg-base/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/banners/${b.id}`}
                        className="block"
                        aria-label={`Edit ${b.title}`}
                      >
                        <div className="relative h-12 w-16 overflow-hidden rounded-md bg-ink-500/5">
                          {b.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={b.imageUrl}
                              alt={b.imageAlt}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/banners/${b.id}`}
                        className="font-medium text-ink-900 transition hover:text-accent-primary"
                      >
                        {b.title}
                      </Link>
                      {b.subtitle && (
                        <p className="truncate text-[11px] text-ink-500">{b.subtitle}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-ink-700">{b.placement}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                      {b.sortOrder}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={b.active ? "success" : "neutral"}>
                        {b.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip label="Edit banner" side="left" hideOnMobile>
                        <Link
                          href={`/admin/banners/${b.id}`}
                          aria-label={`Edit ${b.title}`}
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
            {filtered.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/admin/banners/${b.id}`}
                  className="flex items-center gap-2.5 rounded-xl border border-ink-500/10 bg-bg-elevated p-2 shadow-card transition hover:-translate-y-0.5 hover:shadow-elev"
                >
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-ink-500/5">
                    {b.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.imageUrl}
                        alt={b.imageAlt}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium leading-tight text-ink-900">
                        {b.title}
                      </span>
                      <Badge
                        tone={b.active ? "success" : "neutral"}
                        className="!px-1.5 !py-0.5 !text-[9px] !tracking-wider"
                      >
                        {b.active ? "Active" : "Off"}
                      </Badge>
                    </div>
                    {b.subtitle && (
                      <span className="truncate text-[10px] text-ink-500">{b.subtitle}</span>
                    )}
                    <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-ink-500">
                      <span>{b.placement}</span>
                      <span>·</span>
                      <span>#{b.sortOrder}</span>
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
