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
        className="inline-flex items-center gap-2 rounded-sm border border-ink-500/30 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-700"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Filter" side="left">
        <FilterRail {...props} />
      </Sheet>
    </>
  );
}
