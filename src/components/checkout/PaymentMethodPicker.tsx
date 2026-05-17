"use client";

import { clsx } from "@/lib/utils/clsx";
import type { PaymentMethod } from "@/types/domain";

export interface PaymentMethodPickerProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const OPTIONS: { value: PaymentMethod; label: string; description: string }[] = [
  {
    value: "razorpay",
    label: "Pay online",
    description: "UPI, cards, netbanking, wallets (via Razorpay) — stubbed for this preview.",
  },
  {
    value: "cod",
    label: "Cash on delivery",
    description: "Pay in cash when your saree is delivered.",
  },
];

export function PaymentMethodPicker({ selected, onChange }: PaymentMethodPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      {OPTIONS.map((opt) => {
        const active = opt.value === selected;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              "flex w-full flex-col items-start gap-1 rounded-sm border p-4 text-left transition",
              active
                ? "border-accent-primary bg-accent-primary/5"
                : "border-ink-500/20 hover:border-ink-700",
            )}
          >
            <span className="text-sm font-medium text-ink-900">{opt.label}</span>
            <span className="text-xs text-ink-500">{opt.description}</span>
          </button>
        );
      })}
    </div>
  );
}
