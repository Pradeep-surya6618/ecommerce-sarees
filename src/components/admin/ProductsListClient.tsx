"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import { Tooltip } from "@/components/admin/Tooltip";
import { Badge } from "@/components/ui/Badge";
import type { Product } from "@/types/domain";

interface Props {
  products: Product[];
}

function statusTone(s: Product["status"]): "success" | "neutral" | "warning" {
  if (s === "active") return "success";
  if (s === "draft") return "neutral";
  return "warning";
}

export function ProductsListClient({ products }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categorySlug.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Products</h1>
            <p className="text-[11px] text-ink-700 sm:text-sm">
              {products.length} product{products.length === 1 ? "" : "s"} in store
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-accent-primary px-3 text-xs font-medium text-white shadow-[0_8px_24px_-12px_rgba(91,58,138,0.7)] transition hover:bg-accent-primary-hover sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">New product</span>
            <span className="xs:hidden sm:hidden">New</span>
          </Link>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, category, fabric…"
            className="autofill-on-light h-10 w-full rounded-full border border-ink-500/15 bg-bg-elevated pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary focus:bg-white sm:h-11"
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
          <p className="text-sm text-ink-500">
            {query ? `No products match "${query}".` : "No products yet."}
          </p>
          {!query && (
            <Link
              href="/admin/products/new"
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
            >
              <Plus className="h-4 w-4" /> New product
            </Link>
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
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    Stock
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
                {filtered.map((p) => {
                  const stock = p.variants.reduce((n, v) => n + v.stock, 0);
                  return (
                    <tr key={p.id} className="group transition hover:bg-bg-base/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="block"
                          aria-label={`Edit ${p.name}`}
                        >
                          <div className="relative h-14 w-10 overflow-hidden rounded-md bg-ink-500/5">
                            {p.images[0] && (
                              <Image
                                src={p.images[0].url}
                                alt={p.images[0].alt}
                                fill
                                sizes="40px"
                                className="object-cover transition group-hover:scale-105"
                              />
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-medium text-ink-900 transition hover:text-accent-primary"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-700">{p.categorySlug}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink-900">
                        {formatRupees(p.priceInPaise)}
                      </td>
                      <td
                        className={clsx(
                          "px-4 py-3 text-right tabular-nums",
                          stock === 0 ? "text-danger" : stock < 5 ? "text-warning" : "text-ink-700",
                        )}
                      >
                        {stock}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Tooltip label="Edit product" side="left" hideOnMobile>
                          <Link
                            href={`/admin/products/${p.id}`}
                            aria-label={`Edit ${p.name}`}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-ink-500/15 bg-bg-elevated text-ink-700 transition hover:border-accent-primary hover:bg-accent-primary/5 hover:text-accent-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {filtered.map((p) => {
              const stock = p.variants.reduce((n, v) => n + v.stock, 0);
              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex items-center gap-2.5 rounded-xl border border-ink-500/10 bg-bg-elevated p-2 shadow-card transition hover:-translate-y-0.5 hover:shadow-elev"
                  >
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-ink-500/5">
                      {p.images[0] && (
                        <Image
                          src={p.images[0].url}
                          alt={p.images[0].alt}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[13px] font-medium leading-tight text-ink-900">
                        {p.name}
                      </span>
                      <span className="truncate text-[10px] text-ink-500">
                        {p.categorySlug} · {p.fabric}
                      </span>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold tabular-nums text-ink-900">
                          {formatRupees(p.priceInPaise)}
                        </span>
                        <span
                          className={clsx(
                            "text-[9px] uppercase tracking-wider",
                            stock === 0
                              ? "text-danger"
                              : stock < 5
                                ? "text-warning"
                                : "text-ink-500",
                          )}
                        >
                          · {stock} in stock
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge
                        tone={statusTone(p.status)}
                        className="!px-1.5 !py-0.5 !text-[9px] !tracking-wider"
                      >
                        {p.status}
                      </Badge>
                      <span
                        aria-hidden
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink-500/15 text-ink-700"
                      >
                        <Pencil className="h-3 w-3" />
                      </span>
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
