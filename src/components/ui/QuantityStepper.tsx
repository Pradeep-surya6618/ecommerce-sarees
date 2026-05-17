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
        "inline-flex items-center rounded-sm border border-ink-500/30 bg-bg-elevated",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={dec}
        disabled={value <= min}
        className="flex h-10 w-10 items-center justify-center text-ink-700 transition hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span aria-live="polite" className="w-10 text-center font-medium tabular-nums text-ink-900">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={inc}
        disabled={value >= max}
        className="flex h-10 w-10 items-center justify-center text-ink-700 transition hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
