"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { clsx } from "@/lib/utils/clsx";

type Side = "top" | "right" | "bottom" | "left" | "bottom-start" | "bottom-end";

export interface TooltipProps {
  label: string;
  side?: Side;
  className?: string;
  hideOnMobile?: boolean;
  children: ReactNode;
}

interface Position {
  top: number;
  left: number;
  transform: string;
}

function getPosition(rect: DOMRect, side: Side): Position {
  const gap = 8;
  switch (side) {
    case "top":
      return {
        top: rect.top - gap,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
      };
    case "bottom":
      return {
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, 0)",
      };
    case "bottom-start":
      return {
        top: rect.bottom + gap,
        left: rect.left,
        transform: "translate(0, 0)",
      };
    case "bottom-end":
      return {
        top: rect.bottom + gap,
        left: rect.right,
        transform: "translate(-100%, 0)",
      };
    case "left":
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - gap,
        transform: "translate(-100%, -50%)",
      };
    case "right":
    default:
      return {
        top: rect.top + rect.height / 2,
        left: rect.right + gap,
        transform: "translate(0, -50%)",
      };
  }
}

export function Tooltip({
  label,
  side = "bottom",
  className,
  hideOnMobile,
  children,
}: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);

  const show = () => {
    if (hideOnMobile && window.matchMedia("(max-width: 767px)").matches) return;
    const el = triggerRef.current;
    if (!el) return;
    setPos(getPosition(el.getBoundingClientRect(), side));
    setOpen(true);
  };

  const hide = () => setOpen(false);

  return (
    <span
      ref={triggerRef}
      className={clsx("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onMouseDown={hide}
    >
      {children}
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <span
              role="tooltip"
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                transform: pos.transform,
              }}
              className="pointer-events-none z-[100] whitespace-nowrap rounded-md bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-white/10"
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
