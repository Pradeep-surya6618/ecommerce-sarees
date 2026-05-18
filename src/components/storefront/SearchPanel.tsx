"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { formatRupees } from "@/lib/money";
import { searchProductsAction } from "@/server/actions/search";
import type { Product } from "@/types/domain";

export function SearchPanel() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

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
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside closes.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    // Defer one frame so the opening click doesn't immediately close it.
    const id = setTimeout(() => document.addEventListener("mousedown", onClick), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  function closeAndReset() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  const showResults = open && query.trim().length > 0;
  const showNoResults = showResults && !pending && results.length === 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Search"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-700 transition hover:bg-ink-900/5 hover:text-ink-900"
      >
        <Search className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Search products"
          className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,560px)] overflow-hidden rounded-md border border-ink-500/15 bg-bg-elevated shadow-elev"
        >
          <div className="relative flex items-center gap-2 border-b border-ink-500/10 p-3">
            <Search aria-hidden className="ml-2 h-5 w-5 shrink-0 text-ink-500" />
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
              className="h-10 flex-1 bg-transparent text-base text-ink-900 placeholder:text-ink-500 focus:outline-none"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={closeAndReset}
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-500 transition hover:bg-ink-900/5 hover:text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {!showResults && (
              <div className="px-4 py-6 text-sm text-ink-500">
                Try a fabric (silk, linen), an occasion (wedding, office), or a colour (maroon,
                sage).
              </div>
            )}

            {showResults && pending && results.length === 0 && (
              <div className="px-4 py-6 text-sm text-ink-500">Searching…</div>
            )}

            {showNoResults && (
              <div className="px-4 py-6 text-sm text-ink-500">
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
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-bg-base/70"
                      >
                        <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-sm bg-ink-500/5">
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
                        <div className="flex flex-1 flex-col">
                          <span className="font-medium text-ink-900">{product.name}</span>
                          <span className="text-xs uppercase tracking-wide text-ink-500">
                            {product.fabric}
                          </span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-ink-900">
                          {formatRupees(product.priceInPaise)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
