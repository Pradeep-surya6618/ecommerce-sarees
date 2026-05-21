"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Category } from "@/types/domain";

export interface CategoryRow extends Category {
  productCount: number;
}

interface Props {
  rows: CategoryRow[];
}

export function CategoriesListClient({ rows }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.parentSlug ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Categories</h1>
            <p className="text-[11px] text-ink-700 sm:text-sm">
              {rows.length} categor{rows.length === 1 ? "y" : "ies"} in store
            </p>
          </div>
          <Link
            href="/admin/categories/new"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-accent-primary px-3 text-xs font-medium text-white shadow-[0_8px_24px_-12px_rgba(91,58,138,0.7)] transition hover:bg-accent-primary-hover sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>New</span>
            <span className="hidden sm:inline">category</span>
          </Link>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, slug or parent…"
            className="autofill-on-light h-10 w-full rounded-full border border-ink-500/15 bg-bg-elevated pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary focus:bg-white sm:h-11"
          />
        </div>

        <p className="rounded-xl border border-accent-gold/30 bg-accent-gold/[0.06] px-3 py-2 text-[11px] text-ink-700 sm:px-4 sm:py-3 sm:text-xs">
          Products are linked to a category by its slug. After creating a category, edit a product
          and pick this category from the dropdown.
        </p>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
          <p className="text-sm text-ink-500">
            {query ? `No categories match "${query}".` : "No categories yet."}
          </p>
          {!query && (
            <Link
              href="/admin/categories/new"
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
            >
              <Plus className="h-4 w-4" /> New category
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated shadow-card md:block">
            <table className="min-w-full divide-y divide-ink-500/10 text-sm">
              <thead className="bg-bg-base/50">
                <tr>
                  <th scope="col" className="w-[72px] px-4 py-3" />
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
                    Slug
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Parent
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Sort
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Products
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-500/10">
                {filtered.map((c) => (
                  <tr key={c.id} className="group transition hover:bg-bg-base/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/categories/${c.slug}`}
                        className="block"
                        aria-label={`Edit ${c.name}`}
                      >
                        <div className="relative h-12 w-12 overflow-hidden rounded-md bg-ink-500/5">
                          {c.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.imageUrl}
                              alt={c.name}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/categories/${c.slug}`}
                        className="font-medium text-ink-900 transition hover:text-accent-primary"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-ink-700">/shop/{c.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      {c.parentSlug ? (
                        <Badge tone="neutral">{c.parentSlug}</Badge>
                      ) : (
                        <span className="text-ink-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                      {c.sortOrder}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={c.productCount > 0 ? "text-ink-900 font-medium" : "text-ink-500"}
                      >
                        {c.productCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/categories/${c.slug}`}
                  className="flex items-center gap-2.5 rounded-xl border border-ink-500/10 bg-bg-elevated p-2 shadow-card transition hover:-translate-y-0.5 hover:shadow-elev"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-ink-500/5">
                    {c.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[13px] font-medium leading-tight text-ink-900">
                      {c.name}
                    </span>
                    <span className="truncate font-mono text-[10px] text-ink-500">
                      /shop/{c.slug}
                    </span>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-ink-500">
                      <span>{c.productCount} products</span>
                      {c.parentSlug && (
                        <>
                          <span>·</span>
                          <span>↳ {c.parentSlug}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-ink-500">
                    #{c.sortOrder}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
