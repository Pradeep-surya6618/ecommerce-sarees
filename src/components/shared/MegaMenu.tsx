"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Flame } from "lucide-react";
import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import type { Product } from "@/types/domain";

export interface MegaMenuChildItem {
  id: string;
  label: string;
  href: string;
}

export interface MegaMenuItem {
  id: string;
  label: string;
  href: string;
  isCategory: boolean;
  children: MegaMenuChildItem[];
  trending: Product[];
}

export interface MegaMenuProps {
  items: MegaMenuItem[];
}

function isItemActive(href: string, pathname: string, sp: URLSearchParams): boolean {
  const [hrefPath, hrefQuery] = href.split("?");
  if (!hrefPath) return false;
  // Items whose href specifies query params (e.g. /shop?sort=newest):
  // match only when pathname AND every query param match the current URL.
  if (hrefQuery) {
    if (pathname !== hrefPath) return false;
    const hrefSp = new URLSearchParams(hrefQuery);
    for (const [k, v] of hrefSp.entries()) {
      if (sp.get(k) !== v) return false;
    }
    return true;
  }
  // Plain /shop should not light up when the URL has a `sort` param
  // (that variant belongs to a sibling item like "New Arrivals").
  if (hrefPath === "/shop") {
    return pathname === "/shop" && !sp.has("sort");
  }
  // Category paths — exact path or any sub-path.
  return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
}

export function MegaMenu({ items }: MegaMenuProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onBlurCapture(e: React.FocusEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    if (!containerRef.current.contains(e.relatedTarget as Node | null)) {
      setOpenId(null);
    }
  }

  function openWith(id: string) {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpenId(id);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  }

  const openItem = items.find((i) => i.id === openId) ?? null;
  // Only open the panel if the item has children — otherwise the link is a plain top-level link.
  const showPanel = !!openItem && openItem.children.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative hidden md:block"
      onMouseLeave={scheduleClose}
      onBlurCapture={onBlurCapture}
    >
      <nav className="flex h-20 items-center gap-1 lg:gap-2">
        {items.map((item) => {
          const isOpen = openId === item.id && item.children.length > 0;
          const isActive = isItemActive(item.href, pathname, searchParams);
          const highlighted = isOpen || isActive;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-haspopup={item.children.length > 0 ? "true" : undefined}
              aria-expanded={item.children.length > 0 ? isOpen : undefined}
              aria-current={isActive ? "page" : undefined}
              onMouseEnter={() => openWith(item.id)}
              onFocus={() => openWith(item.id)}
              onClick={() => setOpenId(null)}
              className={clsx(
                "group relative inline-flex h-full cursor-pointer items-center px-3 font-display text-[15px] transition lg:px-4 lg:text-base",
                highlighted
                  ? "font-medium text-accent-primary"
                  : "font-normal text-ink-700 hover:text-ink-900",
              )}
            >
              <span>{item.label}</span>
              <span
                aria-hidden
                className={clsx(
                  "absolute bottom-4 left-1/2 h-[1.5px] -translate-x-1/2 bg-accent-primary transition-all duration-300",
                  highlighted ? "w-6" : "w-0 group-hover:w-6",
                )}
              />
            </Link>
          );
        })}
      </nav>

      {showPanel && openItem && (
        <div
          className="megamenu-enter absolute left-1/2 top-full z-50 mt-[1px] w-[min(1200px,calc(100vw-2rem))]"
          onMouseEnter={() => openWith(openItem.id)}
          onMouseLeave={scheduleClose}
        >
          <div className="rounded-md border border-ink-500/10 bg-bg-elevated shadow-2xl">
            <MegaMenuPanel item={openItem} onNavigate={() => setOpenId(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function MegaMenuPanel({ item, onNavigate }: { item: MegaMenuItem; onNavigate: () => void }) {
  const { label, href, children, trending, isCategory } = item;
  const hasTrending = isCategory && trending.length > 0;

  return (
    <div
      className={clsx(
        "grid gap-8 p-7",
        hasTrending ? "md:grid-cols-[minmax(220px,1fr)_2.4fr]" : "md:grid-cols-1",
      )}
    >
      {/* Subcategories / child links */}
      <div className="flex flex-col gap-4">
        <h3 className="font-display text-lg text-ink-900">{label}</h3>
        <ul
          className={clsx(
            "grid grid-cols-1 gap-x-6 gap-y-2",
            children.length > 4 && "lg:grid-cols-2",
          )}
        >
          {children.map((c) => (
            <li key={c.id}>
              <Link
                href={c.href}
                onClick={onNavigate}
                className="inline-block text-sm text-ink-700 underline decoration-transparent decoration-2 underline-offset-4 transition-all duration-200 hover:text-accent-primary hover:decoration-accent-primary/60"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={href}
          onClick={onNavigate}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent-primary transition hover:text-accent-primary-hover"
        >
          View All {label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Trending — only for category-kind items */}
      {hasTrending && (
        <div className="flex flex-col gap-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-ink-500">
            <span className="megamenu-flame-pulse inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
              <Flame className="h-3 w-3" />
            </span>
            Trending
          </span>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {trending.map((p, idx) => (
              <li
                key={p.id}
                className="megamenu-item-enter"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <Link
                  href={`/product/${p.slug}`}
                  onClick={onNavigate}
                  className="group flex items-center gap-3 rounded-sm p-1.5 transition hover:bg-ink-500/5"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-ink-500/5">
                    {p.images[0] && (
                      <Image
                        src={p.images[0].url}
                        alt={p.images[0].alt}
                        fill
                        sizes="64px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="line-clamp-2 text-xs text-ink-700 transition group-hover:text-ink-900">
                      {p.name}
                    </span>
                    <span className="mt-1 text-sm font-semibold text-accent-primary tabular-nums">
                      {formatRupees(p.priceInPaise)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
