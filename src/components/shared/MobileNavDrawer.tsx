"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import {
  CloseIcon,
  HeartIcon,
  MenuIcon,
  UserIcon as PremiumUserIcon,
} from "@/components/shared/icons";
import type { MegaMenuItem } from "@/components/shared/MegaMenu";
import type { User } from "@/types/domain";

export interface MobileNavDrawerProps {
  items: MegaMenuItem[];
  user: User | null;
}

const TRANSITION_MS = 280;

export function MobileNavDrawer({ items, user }: MobileNavDrawerProps) {
  const accountHref = user ? "/account" : "/auth/login";
  const accountLabel = user ? "My account" : "Sign in";
  // `mounted` controls DOM presence; `show` drives the animation state.
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  function openDrawer() {
    setMounted(true);
    // Stage the entrance across two frames so the initial transform paints before transitioning.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShow(true));
    });
  }

  function close() {
    setShow(false);
    window.setTimeout(() => setMounted(false), TRANSITION_MS);
  }

  const overlay = mounted ? (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={close}
        className={clsx(
          "absolute inset-0 bg-ink-900/50 backdrop-blur-sm transition-opacity duration-200 ease-out",
          show ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        className={clsx(
          "absolute inset-y-0 left-0 flex w-[min(360px,85vw)] flex-col bg-bg-base shadow-2xl transition-transform ease-out",
          show ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
      >
        <header className="relative flex items-center justify-between border-b border-ink-500/10 px-5 py-4">
          <div className="flex flex-col">
            <span className="font-display text-xl leading-none text-ink-900">Saree Store</span>
            <span
              aria-hidden
              className="mt-1.5 h-px w-8 bg-gradient-to-r from-accent-gold to-transparent"
            />
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-accent-primary text-white shadow-sm transition hover:bg-accent-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <nav className="scrollbar-hide flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col">
            {items.map((item) => {
              const isExpanded = expanded === item.id;
              const hasChildren = item.children.length > 0;
              return (
                <li key={item.id} className="border-b border-ink-500/10 last:border-0">
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={close}
                      className="flex-1 px-3 py-3 text-sm font-medium text-ink-900"
                    >
                      {item.label}
                    </Link>
                    {hasChildren && (
                      <button
                        type="button"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                        aria-expanded={isExpanded}
                        onClick={() => setExpanded(isExpanded ? null : item.id)}
                        className="inline-flex h-10 w-10 items-center justify-center text-ink-500 transition hover:text-ink-900"
                      >
                        <ChevronDown
                          className={clsx(
                            "h-4 w-4 transition-transform duration-300",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                  </div>
                  {hasChildren && (
                    <div
                      className={clsx(
                        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <ul className="flex flex-col gap-1 overflow-hidden bg-ink-500/[0.03] px-3">
                        <li className="pt-1" aria-hidden />
                        {item.children.map((c) => (
                          <li key={c.id}>
                            <Link
                              href={c.href}
                              onClick={close}
                              className="block rounded-sm px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-500/10 hover:text-ink-900"
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link
                            href={item.href}
                            onClick={close}
                            className="block rounded-sm px-3 py-2 text-sm font-medium text-accent-primary transition hover:bg-ink-500/10"
                          >
                            View all {item.label} →
                          </Link>
                        </li>
                        <li className="pb-3" aria-hidden />
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <footer className="border-t border-ink-500/10 bg-ink-500/[0.02] px-2 py-3">
          <ul className="flex flex-col">
            <li>
              <Link
                href={accountHref}
                onClick={close}
                className="flex items-center gap-3 rounded-sm px-3 py-3 text-sm text-ink-700 transition hover:bg-ink-500/10 hover:text-ink-900"
              >
                <PremiumUserIcon className="h-[18px] w-[18px]" />
                {accountLabel}
              </Link>
            </li>
            <li>
              <Link
                href="/account/wishlist"
                onClick={close}
                className="flex items-center gap-3 rounded-sm px-3 py-3 text-sm text-ink-700 transition hover:bg-ink-500/10 hover:text-ink-900"
              >
                <HeartIcon className="h-[18px] w-[18px]" />
                Wishlist
              </Link>
            </li>
          </ul>
        </footer>
      </aside>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={openDrawer}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-900/[0.06] hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
      >
        <MenuIcon className="h-[20px] w-[20px]" />
      </button>
      {overlay && typeof document !== "undefined" ? createPortal(overlay, document.body) : null}
    </>
  );
}
