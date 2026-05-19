"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Heart, Menu, User as UserIcon, X } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import type { MegaMenuItem } from "@/components/shared/MegaMenu";
import { IconButton } from "@/components/ui/IconButton";
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
          <IconButton aria-label="Close" size="sm" onClick={close}>
            <X className="h-5 w-5" />
          </IconButton>
        </header>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
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
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                  </div>
                  {hasChildren && isExpanded && (
                    <ul className="flex flex-col gap-1 bg-ink-500/[0.03] px-3 pb-3 pt-1">
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
                    </ul>
                  )}
                </li>
              );
            })}
            <li>
              <Link
                href="/shop"
                onClick={close}
                className="block px-3 py-3 text-sm font-medium text-accent-primary"
              >
                All Sarees
              </Link>
            </li>
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
                <UserIcon className="h-4 w-4" />
                {accountLabel}
              </Link>
            </li>
            <li>
              <Link
                href="/account/wishlist"
                onClick={close}
                className="flex items-center gap-3 rounded-sm px-3 py-3 text-sm text-ink-700 transition hover:bg-ink-500/10 hover:text-ink-900"
              >
                <Heart className="h-4 w-4" />
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
        <Menu className="h-[18px] w-[18px]" />
      </button>
      {overlay && typeof document !== "undefined" ? createPortal(overlay, document.body) : null}
    </>
  );
}
