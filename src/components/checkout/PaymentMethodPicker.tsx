"use client";

import { Banknote, Check, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import type { PaymentMethod } from "@/types/domain";

export interface PaymentMethodPickerProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const OPTIONS: { value: PaymentMethod; label: string; description: string; icon: LucideIcon }[] = [
  {
    value: "razorpay",
    label: "Pay online",
    description: "UPI, cards, netbanking, or wallets — secured by Razorpay.",
    icon: CreditCard,
  },
  {
    value: "cod",
    label: "Cash on delivery",
    description: "Pay in cash when your saree is delivered.",
    icon: Banknote,
  },
];

export function PaymentMethodPicker({ selected, onChange }: PaymentMethodPickerProps) {
  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      {OPTIONS.map((opt) => {
        const active = opt.value === selected;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={clsx(
              "group flex w-full cursor-pointer items-start gap-3 rounded-2xl border bg-bg-elevated p-3 text-left transition sm:gap-4 sm:p-4",
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
              <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink-900 sm:text-base">{opt.label}</span>
              <span className="text-[11px] leading-relaxed text-ink-500 sm:text-xs">
                {opt.description}
              </span>
            </div>

            <span
              aria-hidden
              className={clsx(
                "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition sm:h-6 sm:w-6",
                active
                  ? "bg-accent-primary text-white"
                  : "border border-ink-500/30 bg-bg-elevated text-transparent",
              )}
            >
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
