"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

// useSyncExternalStore-based client check — returns false during SSR/first
// render, true once we know we're on the client. Avoids hydration mismatches
// without triggering react-hooks/set-state-in-effect.
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

const TRANSITION_MS = 220;

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  icon?: LucideIcon;
  pending?: boolean;
  /** "confirm" (default) shows confirm + cancel buttons.
   *  "info" shows a single button (defaults to "Got it") that calls onConfirm. */
  mode?: "confirm" | "info";
}

/**
 * Centered modal confirmation. Backdrop fades; the card slides down from the
 * top into center on open and reverses on close.
 *
 * The dialog is always portaled into the DOM but rendered inert (no pointer
 * events, hidden from a11y, `inert` attribute) when `open` is false. Toggling
 * the prop drives CSS transitions directly — no setState-inside-useEffect
 * dance required to play the exit animation before unmount.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  icon,
  pending = false,
  mode = "confirm",
}: ConfirmDialogProps) {
  const isInfo = mode === "info";
  const resolvedConfirmLabel = confirmLabel ?? (isInfo ? "Got it" : "Confirm");
  // Lock page scroll while open + close on Escape. Locks BOTH html and body
  // (html is the viewport scroll container; body holds layout), and pads each
  // by the scrollbar width so removing the scrollbar doesn't cause a sideways
  // jump. Compatible with `overflow-x: clip` set globally on html/body.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlPaddingRight: html.style.paddingRight,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    // Reserve the scrollbar's width on the viewport (html) only — padding
    // both would double-shift the content.
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
      body.style.paddingRight = prev.bodyPaddingRight;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const isClient = useIsClient();
  if (!isClient) return null;

  const Icon = icon ?? AlertTriangle;
  const isDanger = tone === "danger";

  return createPortal(
    <div
      role="dialog"
      aria-modal={open ? "true" : undefined}
      aria-hidden={!open ? "true" : undefined}
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? "confirm-dialog-desc" : undefined}
      // `inert` makes the entire subtree non-focusable and non-interactive
      // when the dialog is closed. React 19 expects a real boolean here.
      inert={!open}
      className={clsx(
        "fixed inset-0 z-[80] flex items-center justify-center px-4 py-10 sm:px-6",
        !open && "pointer-events-none",
      )}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className={clsx(
          "absolute inset-0 cursor-default bg-ink-900/55 backdrop-blur-sm transition-opacity ease-out",
          open ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
      />

      {/* Card */}
      <div
        className={clsx(
          "relative w-full max-w-sm overflow-hidden rounded-2xl bg-bg-base shadow-[0_24px_60px_rgba(37,31,62,0.35)] transition-all ease-out",
          open ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0",
        )}
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
      >
        {/* Brass hairline */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/70 to-transparent"
        />

        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-900/[0.06] hover:text-ink-900"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex flex-col items-center gap-3 px-5 pt-7 text-center sm:gap-4 sm:px-7 sm:pt-9">
          {/* Icon */}
          <span
            className={clsx(
              "inline-flex h-11 w-11 items-center justify-center rounded-full sm:h-12 sm:w-12",
              isDanger ? "bg-danger/10 text-danger" : "bg-accent-primary/10 text-accent-primary",
            )}
          >
            <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
          </span>

          {/* Copy */}
          <div className="flex flex-col gap-1">
            <h2
              id="confirm-dialog-title"
              className="font-display text-lg leading-tight text-ink-900 sm:text-xl"
            >
              {title}
            </h2>
            {description && (
              <p
                id="confirm-dialog-desc"
                className="text-xs leading-relaxed text-ink-700 sm:text-sm"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-ink-500/10 bg-bg-elevated px-4 py-3 sm:mt-8 sm:px-5 sm:py-4">
          {!isInfo && (
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border border-ink-500/20 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-700 transition hover:border-ink-700 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-5 sm:text-xs"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={clsx(
              "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition disabled:cursor-not-allowed disabled:opacity-80 sm:h-10 sm:px-5 sm:text-xs",
              isDanger
                ? "bg-danger hover:bg-[#7a1812]"
                : "bg-accent-primary hover:bg-accent-primary-hover",
            )}
          >
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Deleting…
              </>
            ) : (
              resolvedConfirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
