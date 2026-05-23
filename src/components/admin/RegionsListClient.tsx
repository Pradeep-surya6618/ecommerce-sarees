"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin, Pencil, Plus, Search } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { Tooltip } from "@/components/admin/Tooltip";
import { Badge } from "@/components/ui/Badge";
import type { Region } from "@/types/domain";

interface Props {
  regions: Region[];
}

export function RegionsListClient({ regions }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter(
      (r) =>
        r.state.toLowerCase().includes(q) ||
        r.craft.toLowerCase().includes(q) ||
        r.href.toLowerCase().includes(q),
    );
  }, [regions, query]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Regions</h1>
            <p className="text-[11px] text-ink-700 sm:text-sm">
              {regions.length} {regions.length === 1 ? "region" : "regions"} — shown on the home
              page “Crafts by region” section.
            </p>
          </div>
          <Link
            href="/admin/regions/new"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-accent-primary px-3 text-xs font-medium text-white shadow-[0_8px_24px_-12px_rgba(91,58,138,0.7)] transition hover:bg-accent-primary-hover sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>New</span>
            <span className="hidden sm:inline">region</span>
          </Link>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by state or craft…"
            className="autofill-on-light h-10 w-full rounded-full border border-ink-500/15 bg-bg-elevated pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary focus:bg-white sm:h-11"
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-500/10 text-ink-500">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="text-sm text-ink-500">
            {query ? "No regions match this search." : "No regions yet."}
          </p>
          {!query && (
            <Link
              href="/admin/regions/new"
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
            >
              <Plus className="h-4 w-4" /> New region
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
                    State
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Craft
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Link
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
                {filtered.map((r) => (
                  <tr key={r.id} className="group transition hover:bg-bg-base/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/regions/${r.id}`}
                        className="block"
                        aria-label={`Edit ${r.state}`}
                      >
                        <div className="relative h-12 w-16 overflow-hidden rounded-md bg-ink-500/5">
                          {r.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.imageUrl}
                              alt={`${r.craft} from ${r.state}`}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/regions/${r.id}`}
                        className="font-medium text-ink-900 transition hover:text-accent-primary"
                      >
                        {r.state}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{r.craft}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-ink-700">{r.href}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                      {r.sortOrder}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={r.active ? "success" : "neutral"}>
                        {r.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip label="Edit region" side="left" hideOnMobile>
                        <Link
                          href={`/admin/regions/${r.id}`}
                          aria-label={`Edit ${r.state}`}
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
            {filtered.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/regions/${r.id}`}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-xl border border-ink-500/10 bg-bg-elevated p-2 shadow-card transition hover:-translate-y-0.5 hover:shadow-elev",
                  )}
                >
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-ink-500/5">
                    {r.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.imageUrl}
                        alt={`${r.craft} from ${r.state}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium leading-tight text-ink-900">
                        {r.state}
                      </span>
                      <Badge
                        tone={r.active ? "success" : "neutral"}
                        className="!px-1.5 !py-0.5 !text-[9px] !tracking-wider"
                      >
                        {r.active ? "Active" : "Off"}
                      </Badge>
                    </div>
                    <span className="truncate text-[10px] text-ink-500">{r.craft}</span>
                    <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-ink-500">
                      <span>{r.href}</span>
                      <span>·</span>
                      <span>#{r.sortOrder}</span>
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
