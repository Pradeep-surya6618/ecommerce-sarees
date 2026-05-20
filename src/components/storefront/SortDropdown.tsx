"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowDownUp, Check, ChevronDown } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { parseShopFilters, serializeShopFilters, type ShopSort } from "@/lib/utils/shop-filters";

const OPTIONS: { value: ShopSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "featured", label: "Featured" },
];

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    params[k] = v;
  });
  const filters = parseShopFilters(params);

  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = OPTIONS.find((o) => o.value === filters.sort) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        closePanel();
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open || activeIdx < 0) return;
    const node = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIdx]);

  function openPanel() {
    const idx = OPTIONS.findIndex((o) => o.value === filters.sort);
    setActiveIdx(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    setActiveIdx(-1);
  }

  function commit(value: ShopSort) {
    closePanel();
    triggerRef.current?.focus();
    const next = { ...filters, sort: value, page: 1 };
    const qs = serializeShopFilters(next);
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openPanel();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = OPTIONS[activeIdx];
      if (opt) commit(opt.value);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(OPTIONS.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIdx(OPTIONS.length - 1);
    } else if (e.key === "Tab") {
      closePanel();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="sort-listbox"
        aria-label="Sort by"
        onClick={() => (open ? closePanel() : openPanel())}
        onKeyDown={onKeyDown}
        className={clsx(
          "flex h-9 cursor-pointer items-center gap-2 rounded-full border bg-bg-elevated pl-2 pr-1 text-sm transition sm:h-10 sm:pl-3",
          open ? "border-accent-primary" : "border-ink-500/20 hover:border-accent-primary/40",
        )}
      >
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-7 sm:w-7">
          <ArrowDownUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
        </span>
        <span className="truncate text-[12px] font-medium text-ink-900 sm:text-sm">
          {selected?.label ?? "Newest"}
        </span>
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900/[0.04] text-ink-500 transition sm:h-8 sm:w-8">
          <ChevronDown
            className={clsx("h-3.5 w-3.5 transition", open && "-rotate-180")}
            aria-hidden
          />
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[220px] overflow-hidden rounded-2xl border border-ink-500/15 bg-bg-elevated shadow-elev"
          role="presentation"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
          />
          <div className="border-b border-ink-500/10 px-3 py-2 sm:py-2.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
              Sort by
            </span>
          </div>
          <ul
            ref={listRef}
            id="sort-listbox"
            role="listbox"
            className="max-h-72 overflow-y-auto py-1.5"
          >
            {OPTIONS.map((opt, idx) => {
              const isSelected = opt.value === filters.sort;
              const isActive = idx === activeIdx;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(opt.value);
                  }}
                  className={clsx(
                    "flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm transition sm:py-2.5",
                    isActive ? "bg-accent-primary/10 text-ink-900" : "text-ink-700",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check aria-hidden className="h-4 w-4 shrink-0 text-accent-primary" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
