"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EyeOff, FileText, Lock, Pencil, Plus, Search } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { Tooltip } from "@/components/admin/Tooltip";
import { Badge } from "@/components/ui/Badge";
import type { ContentPage, ContentPageGroup } from "@/types/domain";

interface Props {
  pages: ContentPage[];
}

const GROUP_LABEL: Record<ContentPageGroup, string> = {
  help: "Help",
  company: "Company",
  none: "Not in footer",
};

const GROUP_TONE: Record<ContentPageGroup, "neutral" | "gold" | "accent"> = {
  help: "gold",
  company: "accent",
  none: "neutral",
};

type GroupFilter = "" | ContentPageGroup;

const GROUP_PILLS: { value: GroupFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "help", label: "Help" },
  { value: "company", label: "Company" },
  { value: "none", label: "Not in footer" },
];

export function PagesListClient({ pages }: Props) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupFilter>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pages.filter((p) => {
      if (group && p.group !== group) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.footerLabel.toLowerCase().includes(q)
      );
    });
  }, [pages, query, group]);

  const hasActiveFilters = Boolean(query) || Boolean(group);

  function countFor(value: GroupFilter): number {
    if (value === "") return pages.length;
    return pages.filter((p) => p.group === value).length;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Pages</h1>
            <p className="text-[11px] text-ink-700 sm:text-sm">
              {hasActiveFilters
                ? `${filtered.length} of ${pages.length} ${pages.length === 1 ? "page" : "pages"}`
                : `${pages.length} ${pages.length === 1 ? "page" : "pages"} · markdown content shown in the footer and at /p/<slug>`}
            </p>
          </div>
          <Link
            href="/admin/pages/new"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-accent-primary px-3 text-xs font-medium text-white shadow-[0_8px_24px_-12px_rgba(91,58,138,0.7)] transition hover:bg-accent-primary-hover sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>New</span>
            <span className="hidden sm:inline">page</span>
          </Link>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, slug or footer label…"
            className="autofill-on-light h-10 w-full rounded-full border border-ink-500/15 bg-bg-elevated pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary focus:bg-white sm:h-11"
          />
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
          {GROUP_PILLS.map((pill) => {
            const active = group === pill.value;
            const count = countFor(pill.value);
            return (
              <button
                key={pill.value || "all"}
                type="button"
                onClick={() => setGroup(pill.value)}
                className={clsx(
                  "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition sm:h-8 sm:text-xs",
                  active
                    ? "border-accent-primary bg-accent-primary text-white shadow-[0_6px_18px_-10px_rgba(91,58,138,0.7)]"
                    : "border-ink-500/15 bg-bg-elevated text-ink-700 hover:border-accent-primary hover:text-accent-primary",
                )}
              >
                {pill.label}
                <span
                  className={clsx(
                    "font-mono text-[9px] tabular-nums",
                    active ? "text-white/80" : "text-ink-500",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-500/10 text-ink-500">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-sm text-ink-500">
            {hasActiveFilters ? "No pages match these filters." : "No pages yet."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setGroup("");
              }}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink-500/20 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-accent-primary hover:text-accent-primary"
            >
              Clear filters
            </button>
          ) : (
            <Link
              href="/admin/pages/new"
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
            >
              <Plus className="h-4 w-4" /> New page
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2 sm:gap-2.5">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/pages/${p.id}`}
                className={clsx(
                  "group flex items-center gap-2.5 rounded-xl border border-ink-500/10 bg-bg-elevated p-2.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elev sm:gap-3 sm:p-3",
                  !p.visible && "opacity-60",
                )}
              >
                <span
                  className={clsx(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
                    p.group === "help"
                      ? "bg-accent-gold/15 text-accent-gold"
                      : p.group === "company"
                        ? "bg-accent-primary/10 text-accent-primary"
                        : "bg-ink-500/10 text-ink-500",
                  )}
                >
                  <FileText className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium leading-tight text-ink-900 sm:text-sm">
                      {p.title}
                    </span>
                    {p.isSystem && (
                      <span
                        title="System page — slug locked"
                        className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-ink-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-ink-500"
                      >
                        <Lock className="h-2.5 w-2.5" />
                        <span className="hidden sm:inline">System</span>
                      </span>
                    )}
                    {!p.visible && (
                      <span
                        title="Hidden from storefront"
                        className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-ink-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-ink-500"
                      >
                        <EyeOff className="h-2.5 w-2.5" />
                        <span className="hidden sm:inline">Hidden</span>
                      </span>
                    )}
                  </div>
                  <span className="truncate font-mono text-[10px] text-ink-500 sm:text-[11px]">
                    /p/{p.slug}
                  </span>
                </div>
                <Badge
                  tone={GROUP_TONE[p.group]}
                  className="!px-1.5 !py-0.5 !text-[9px] !tracking-wider sm:!px-2 sm:!text-[10px]"
                >
                  {GROUP_LABEL[p.group]}
                </Badge>
                <span className="font-mono text-[10px] tabular-nums text-ink-500 sm:text-[11px]">
                  #{p.sortOrder}
                </span>
                <Tooltip label="Edit page" side="left" hideOnMobile>
                  <span
                    aria-hidden
                    className="hidden h-8 w-8 items-center justify-center rounded-full border border-ink-500/15 bg-bg-elevated text-ink-700 transition group-hover:border-accent-primary group-hover:bg-accent-primary/5 group-hover:text-accent-primary sm:inline-flex"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </span>
                </Tooltip>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
