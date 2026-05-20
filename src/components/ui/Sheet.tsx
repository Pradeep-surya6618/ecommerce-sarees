"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

const TRANSITION_MS = 280;

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: "left" | "right" | "bottom";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Client-only flag — avoids hydration mismatch when portaling to document.body.
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

const sideTransform: Record<NonNullable<SheetProps["side"]>, { closed: string; open: string }> = {
  left: { closed: "-translate-x-full", open: "translate-x-0" },
  right: { closed: "translate-x-full", open: "translate-x-0" },
  bottom: { closed: "translate-y-full", open: "translate-y-0" },
};

const sidePosition: Record<NonNullable<SheetProps["side"]>, string> = {
  left: "left-0 top-0 h-full w-[88vw] max-w-md",
  right: "right-0 top-0 h-full w-[88vw] max-w-md",
  bottom: "bottom-0 left-0 w-full max-h-[85vh]",
};

export function Sheet({ open, onClose, title, side = "right", children, footer }: SheetProps) {
  // Lock page scroll while open + close on Escape. Locks BOTH html and body
  // (html is the actual viewport scroll container on most pages here) and
  // pads html by the scrollbar width to prevent the page from shifting when
  // the scrollbar disappears.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlPaddingRight: html.style.paddingRight,
      bodyOverflow: body.style.overflow,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      html.style.paddingRight = `${scrollbarWidth}px`;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.paddingRight = prev.htmlPaddingRight;
      body.style.overflow = prev.bodyOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const isClient = useIsClient();
  if (!isClient) return null;

  const transform = sideTransform[side];

  return createPortal(
    <div
      role="dialog"
      aria-modal={open ? "true" : undefined}
      aria-hidden={!open ? "true" : undefined}
      aria-label={title}
      inert={!open}
      className={clsx("fixed inset-0 z-[80]", !open && "pointer-events-none")}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className={clsx(
          "absolute inset-0 cursor-default bg-ink-900/45 backdrop-blur-sm transition-opacity ease-out",
          open ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
      />

      {/* Panel */}
      <div
        className={clsx(
          "absolute flex flex-col bg-bg-base shadow-elev transition-transform ease-out",
          sidePosition[side],
          open ? transform.open : transform.closed,
        )}
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
      >
        {/* Header (with X) — always renders so users can dismiss */}
        <div className="flex items-center justify-between gap-3 border-b border-ink-500/10 px-4 py-3 sm:px-5 sm:py-4">
          {title ? (
            <h2 className="font-display text-base text-ink-900 sm:text-xl">{title}</h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-accent-primary text-white shadow-sm transition hover:bg-accent-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {footer && (
          <div className="border-t border-ink-500/10 bg-bg-elevated px-4 py-3 sm:px-5 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
