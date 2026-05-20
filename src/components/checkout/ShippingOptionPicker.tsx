"use client";

import { Check, Truck } from "lucide-react";
import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import type { ShippingOption } from "@/types/domain";

export interface ShippingOptionPickerProps {
  options: ShippingOption[];
  selectedId: string | null;
  onChange: (option: ShippingOption) => void;
}

export function ShippingOptionPicker({ options, selectedId, onChange }: ShippingOptionPickerProps) {
  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      {options.map((opt) => {
        const active = opt.id === selectedId;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={active}
            className={clsx(
              "group flex w-full cursor-pointer items-center gap-3 rounded-2xl border bg-bg-elevated p-3 text-left transition sm:gap-4 sm:p-4",
              active
                ? "border-accent-primary shadow-sm"
                : "border-ink-500/15 hover:border-accent-primary/40",
            )}
          >
            <span
              className={clsx(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
                active
                  ? "bg-accent-primary text-white"
                  : "bg-accent-primary/10 text-accent-primary group-hover:bg-accent-primary/20",
              )}
            >
              <Truck className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold text-ink-900 sm:text-base">
                {opt.name}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-ink-500 sm:text-xs">
                Delivered in {opt.etaDays} business days
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="text-sm font-semibold tabular-nums text-ink-900 sm:text-base">
                {opt.pricePaise === 0 ? "Free" : formatRupees(opt.pricePaise)}
              </span>
              <span
                aria-hidden
                className={clsx(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full transition sm:h-6 sm:w-6",
                  active
                    ? "bg-accent-primary text-white"
                    : "border border-ink-500/30 bg-bg-elevated text-transparent",
                )}
              >
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
