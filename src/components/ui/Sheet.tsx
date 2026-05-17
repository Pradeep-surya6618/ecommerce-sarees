"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { IconButton } from "./IconButton";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: "left" | "right" | "bottom";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sideClass = {
  left: "left-0 top-0 h-full w-[88vw] max-w-md translate-x-[-100%] data-[open=true]:translate-x-0",
  right: "right-0 top-0 h-full w-[88vw] max-w-md translate-x-full data-[open=true]:translate-x-0",
  bottom: "bottom-0 left-0 w-full max-h-[85vh] translate-y-full data-[open=true]:translate-y-0",
};

export function Sheet({ open, onClose, title, side = "right", children, footer }: SheetProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink-900/40 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div
        data-open={open}
        className={clsx(
          "absolute flex flex-col bg-bg-base shadow-elev transition-transform duration-300 ease-out",
          sideClass[side],
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink-500/10 px-5 py-4">
          <h2 className="font-display text-xl text-ink-900">{title}</h2>
          <IconButton aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-ink-500/10 bg-bg-elevated px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
