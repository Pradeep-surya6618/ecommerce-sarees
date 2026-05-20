"use client";

import { Minus, Plus } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface QuantityStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: QuantityStepperProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full border border-ink-500/20 bg-bg-elevated",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={dec}
        disabled={value <= min}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-ink-700 transition hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:w-9"
      >
        <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </button>
      <span
        aria-live="polite"
        className="w-7 text-center text-xs font-semibold tabular-nums text-ink-900 sm:w-9 sm:text-sm"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={inc}
        disabled={value >= max}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-accent-primary text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
      >
        <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </button>
    </div>
  );
}
