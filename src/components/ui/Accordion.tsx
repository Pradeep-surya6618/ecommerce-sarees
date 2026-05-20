"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface AccordionItemProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ title, defaultOpen, children, className }: AccordionItemProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={clsx("border-b border-ink-500/10", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 py-4 text-left text-sm font-medium text-ink-900 transition hover:text-accent-primary"
      >
        <span>{title}</span>
        <ChevronDown
          aria-hidden
          className={clsx("h-4 w-4 transition-transform", open ? "rotate-180" : "rotate-0")}
        />
      </button>
      {open && <div className="pb-5 text-sm text-ink-700">{children}</div>}
    </div>
  );
}

export function Accordion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx("flex flex-col", className)}>{children}</div>;
}
