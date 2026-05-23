"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, EyeOff, ListTree, Pencil, Plus, Search } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { Tooltip } from "@/components/admin/Tooltip";
import { Badge } from "@/components/ui/Badge";
import type { NavMenuItem } from "@/types/domain";

interface TreeNode {
  item: NavMenuItem;
  children: NavMenuItem[];
}

interface Props {
  tree: TreeNode[];
  totalCount: number;
}

type KindFilter = "" | "category" | "custom-link";

const KIND_PILLS: { value: KindFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "category", label: "Category" },
  { value: "custom-link", label: "Custom" },
];

function resolveHref(item: NavMenuItem): string {
  if (item.kind === "category" && item.categorySlug) return `/shop/${item.categorySlug}`;
  return item.href ?? "—";
}

function matchesQuery(item: NavMenuItem, q: string): boolean {
  if (!q) return true;
  return (
    item.label.toLowerCase().includes(q) ||
    resolveHref(item).toLowerCase().includes(q) ||
    (item.categorySlug ?? "").toLowerCase().includes(q)
  );
}

export function NavigationListClient({ tree, totalCount }: Props) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tree
      .map(({ item, children }): TreeNode => {
        const filteredChildren = children.filter(
          (c) => (!kind || c.kind === kind) && matchesQuery(c, q),
        );
        return { item, children: filteredChildren };
      })
      .filter(({ item, children }) => {
        const parentMatches = (!kind || item.kind === kind) && matchesQuery(item, q);
        return parentMatches || children.length > 0;
      });
  }, [tree, query, kind]);

  const hasActiveFilters = Boolean(query) || Boolean(kind);
  const visibleCount = filtered.reduce((sum, n) => sum + 1 + n.children.length, 0);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Navigation</h1>
            <p className="text-[11px] text-ink-700 sm:text-sm">
              {hasActiveFilters
                ? `${visibleCount} of ${totalCount} items`
                : `${totalCount} items · header menu & mobile drawer`}
            </p>
          </div>
          <Link
            href="/admin/navigation/new"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-accent-primary px-3 text-xs font-medium text-white shadow-[0_8px_24px_-12px_rgba(91,58,138,0.7)] transition hover:bg-accent-primary-hover sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>New</span>
            <span className="hidden sm:inline">item</span>
          </Link>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by label, slug or URL…"
            className="autofill-on-light h-10 w-full rounded-full border border-ink-500/15 bg-bg-elevated pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary focus:bg-white sm:h-11"
          />
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
          {KIND_PILLS.map((pill) => {
            const active = kind === pill.value;
            return (
              <button
                key={pill.value || "all"}
                type="button"
                onClick={() => setKind(pill.value)}
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

        <p className="rounded-xl border border-accent-gold/30 bg-accent-gold/[0.06] px-3 py-2 text-[10px] text-ink-700 sm:px-4 sm:py-3 sm:text-xs">
          Items are shown in <strong>sort order</strong> (lower numbers first). Top-level items
          appear in the header bar; child items appear in the dropdown panel under their parent.
        </p>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-500/10 text-ink-500">
            <ListTree className="h-5 w-5" />
          </div>
          <p className="text-sm text-ink-500">
            {hasActiveFilters
              ? "No menu items match these filters."
              : "No menu items yet. Add one to populate the storefront header."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setKind("");
              }}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink-500/20 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-accent-primary hover:text-accent-primary"
            >
              Clear filters
            </button>
          ) : (
            <Link
              href="/admin/navigation/new"
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
            >
              <Plus className="h-4 w-4" /> New item
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2 sm:gap-2.5">
          {filtered.map(({ item, children }) => (
            <li key={item.id}>
              <NavCard item={item} depth={0} />
              {children.length > 0 && (
                <ul className="mt-1 flex flex-col gap-1 pl-3 sm:mt-1.5 sm:gap-1.5 sm:pl-6">
                  {children.map((child) => (
                    <li key={child.id} className="relative">
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -left-2 top-1/2 h-px w-3 -translate-y-1/2 bg-ink-500/15 sm:-left-3 sm:w-3"
                      />
                      <NavCard item={child} depth={1} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NavCard({ item, depth }: { item: NavMenuItem; depth: number }) {
  const isChild = depth > 0;
  return (
    <Link
      href={`/admin/navigation/${item.id}`}
      className={clsx(
        "group flex items-center gap-2.5 rounded-xl border border-ink-500/10 bg-bg-elevated p-2.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elev sm:gap-3 sm:p-3",
        !item.visible && "opacity-60",
      )}
    >
      <span
        className={clsx(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
          isChild
            ? "bg-ink-900/[0.05] text-ink-500"
            : item.kind === "category"
              ? "bg-accent-primary/10 text-accent-primary"
              : "bg-accent-gold/15 text-accent-gold",
        )}
      >
        {isChild ? <ChevronRight className="h-4 w-4" /> : <ListTree className="h-4 w-4" />}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[13px] font-medium leading-tight text-ink-900 sm:text-sm">
            {item.label}
          </span>
          {!item.visible && (
            <span
              className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-ink-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-ink-500"
              title="Hidden from storefront"
            >
              <EyeOff className="h-2.5 w-2.5" />
              <span className="hidden sm:inline">Hidden</span>
            </span>
          )}
        </div>
        <span className="truncate font-mono text-[10px] text-ink-500 sm:text-[11px]">
          {resolveHref(item)}
        </span>
      </div>

      <Badge
        tone={item.kind === "category" ? "neutral" : "gold"}
        className="!px-1.5 !py-0.5 !text-[9px] !tracking-wider sm:!px-2 sm:!text-[10px]"
      >
        {item.kind === "category" ? "Category" : "Custom"}
      </Badge>
      <span className="font-mono text-[10px] tabular-nums text-ink-500 sm:text-[11px]">
        #{item.sortOrder}
      </span>
      <Tooltip label="Edit item" side="left" hideOnMobile>
        <span
          aria-hidden
          className="hidden h-8 w-8 items-center justify-center rounded-full border border-ink-500/15 bg-bg-elevated text-ink-700 transition group-hover:border-accent-primary group-hover:bg-accent-primary/5 group-hover:text-accent-primary sm:inline-flex"
        >
          <Pencil className="h-3.5 w-3.5" />
        </span>
      </Tooltip>
    </Link>
  );
}
