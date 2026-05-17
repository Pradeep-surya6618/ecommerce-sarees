"use client";

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
    <div className="flex flex-col gap-3">
      {options.map((opt) => {
        const active = opt.id === selectedId;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt)}
            className={clsx(
              "flex w-full items-start justify-between gap-4 rounded-sm border p-4 text-left transition",
              active
                ? "border-accent-primary bg-accent-primary/5"
                : "border-ink-500/20 hover:border-ink-700",
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-ink-900">{opt.name}</span>
              <span className="text-xs text-ink-500">Delivered in {opt.etaDays} business days</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-ink-900">
              {opt.pricePaise === 0 ? "Free" : formatRupees(opt.pricePaise)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
