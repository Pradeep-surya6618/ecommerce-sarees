"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { FilterRail, type FilterRailProps } from "./FilterRail";

export type FilterDrawerProps = FilterRailProps;

export function FilterDrawer(props: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-ink-500/20 bg-bg-elevated pl-2 pr-3 text-sm transition hover:border-accent-primary/40 sm:h-10 sm:pl-3 sm:pr-4"
      >
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-7 sm:w-7">
          <SlidersHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
        </span>
        <span className="text-[12px] font-medium text-ink-900 sm:text-sm">Filters</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Filter" side="left">
        <FilterRail {...props} hideHeading />
      </Sheet>
    </>
  );
}
