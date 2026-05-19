"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";
import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import { searchProductsAction } from "@/server/actions/search";
import { SearchIcon } from "@/components/shared/icons";
import { NavTooltip } from "@/components/shared/NavTooltip";
import type { Product } from "@/types/domain";

const TRANSITION_MS = 220;

export function SearchPanel() {
  // `mounted` controls DOM presence; `show` drives the animation state.
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  function openSearch() {
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShow(true));
    });
  }

  function closeSearch() {
    setShow(false);
    window.setTimeout(() => setMounted(false), TRANSITION_MS);
  }

  function closeAndReset() {
    closeSearch();
    setQuery("");
    setResults([]);
  }

  useEffect(() => {
    if (show) inputRef.current?.focus();
  }, [show]);

  // Position the popup directly under the site header (accounts for the
  // announcement bar above the sticky header at page top, and re-positions
  // as the header's bottom edge changes on scroll/resize).
  useEffect(() => {
    if (!mounted) return;
    function update() {
      const header = document.querySelector("header");
      const popup = popupRef.current;
      if (!header || !popup) return;
      const rect = (header as HTMLElement).getBoundingClientRect();
      popup.style.top = `${Math.max(rect.bottom, 0) + 4}px`;
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [mounted]);

  // Debounced live search. Clears on empty input happen in onChange below
  // so this effect never calls setState synchronously in its body.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const items = await searchProductsAction(trimmed);
          setResults(items);
        } catch {
          setResults([]);
        }
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Esc to close.
  useEffect(() => {
    if (!show) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeSearch();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show]);

  // Click outside closes.
  useEffect(() => {
    if (!show) return;
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      closeSearch();
    }
    const id = setTimeout(() => document.addEventListener("mousedown", onClick), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onClick);
    };
  }, [show]);

  const showResults = show && query.trim().length > 0;
  const showNoResults = showResults && !pending && results.length === 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Search"
        aria-expanded={show}
        onClick={() => (show ? closeSearch() : openSearch())}
        className="group relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-900/[0.06] hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
      >
        <SearchIcon className="h-[20px] w-[20px]" />
        {!mounted && <NavTooltip label="Search" />}
      </button>

      {mounted && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popupRef}
              role="dialog"
              aria-label="Search products"
              className={clsx(
                "fixed left-3 right-3 top-[96px] z-[55] overflow-hidden rounded-md border border-ink-500/15 bg-bg-elevated shadow-elev transition-all duration-200 ease-out md:left-auto md:right-12 md:top-[120px] md:w-[min(92vw,560px)]",
                show
                  ? "translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0",
              )}
            >
              <div className="relative flex items-center gap-1.5 border-b border-ink-500/10 p-2 sm:gap-2 sm:p-3">
                <SearchIcon className="ml-1 h-4 w-4 shrink-0 text-ink-500 sm:ml-2 sm:h-5 sm:w-5" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => {
                    const next = e.target.value;
                    setQuery(next);
                    if (next.trim().length === 0) setResults([]);
                  }}
                  placeholder="Search products…"
                  aria-label="Search products"
                  className="h-8 min-w-0 flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none sm:h-10 sm:text-base [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                />
                {query.length > 0 && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      inputRef.current?.focus();
                    }}
                    className="group relative inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm text-danger transition hover:bg-danger/10 hover:text-danger sm:h-8 sm:w-8"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <NavTooltip label="Clear" tone="danger" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={closeAndReset}
                  className="group relative inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink-500 transition hover:bg-ink-900/5 hover:text-ink-900 sm:h-8 sm:w-8"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <NavTooltip label="Close" />
                </button>
              </div>

              <div className="scrollbar-hide max-h-[60vh] overflow-y-auto">
                {!showResults && (
                  <div className="px-3 py-4 text-xs text-ink-500 sm:px-4 sm:py-6 sm:text-sm">
                    Try a fabric (silk, linen), an occasion (wedding, office), or a colour (maroon,
                    sage).
                  </div>
                )}

                {showResults && pending && results.length === 0 && (
                  <div className="px-3 py-4 text-xs text-ink-500 sm:px-4 sm:py-6 sm:text-sm">
                    Searching…
                  </div>
                )}

                {showNoResults && (
                  <div className="px-3 py-4 text-xs text-ink-500 sm:px-4 sm:py-6 sm:text-sm">
                    No sarees match &ldquo;{query.trim()}&rdquo;.
                  </div>
                )}

                {results.length > 0 && (
                  <ul className="flex flex-col divide-y divide-ink-500/5">
                    {results.map((product) => {
                      const image = product.images[0];
                      return (
                        <li key={product.id}>
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={closeAndReset}
                            className="flex items-center gap-2.5 px-3 py-2.5 transition hover:bg-bg-base/70 sm:gap-3 sm:px-4 sm:py-3"
                          >
                            <div className="relative h-11 w-10 shrink-0 overflow-hidden rounded-sm bg-ink-500/5 sm:h-14 sm:w-12">
                              {image && (
                                <Image
                                  src={image.url}
                                  alt={image.alt}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-sm font-medium text-ink-900 sm:text-base">
                                {product.name}
                              </span>
                              <span className="text-[10px] uppercase tracking-wide text-ink-500 sm:text-xs">
                                {product.fabric}
                              </span>
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-ink-900 sm:text-sm">
                              {formatRupees(product.priceInPaise)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
