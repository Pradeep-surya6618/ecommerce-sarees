import { Receipt } from "lucide-react";
import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";

export interface CartSummaryProps {
  subtotalPaise: number;
  shippingPaise?: number;
  taxPaise: number;
  totalPaise: number;
  className?: string;
}

export function CartSummary({
  subtotalPaise,
  shippingPaise,
  taxPaise,
  totalPaise,
  className,
}: CartSummaryProps) {
  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-5 md:p-6",
        className,
      )}
    >
      {/* Brass hairline */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
      />

      {/* Header */}
      <header className="mb-4 flex items-center gap-3 sm:mb-5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
          <Receipt className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
            Summary
          </span>
          <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
            Order summary
          </h2>
        </div>
      </header>

      {/* Lines */}
      <dl className="flex flex-col gap-1.5 text-[12px] text-ink-700 sm:gap-2 sm:text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatRupees(subtotalPaise)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>GST (5%)</dt>
          <dd className="tabular-nums">{formatRupees(taxPaise)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd className="text-right tabular-nums">
            {typeof shippingPaise === "number"
              ? shippingPaise === 0
                ? "Free"
                : formatRupees(shippingPaise)
              : "Calculated at checkout"}
          </dd>
        </div>
      </dl>

      {/* Total */}
      <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-ink-500/10 pt-3 sm:mt-5 sm:pt-4">
        <span className="font-display text-base text-ink-900 sm:text-lg">Total</span>
        <span className="font-display text-lg tabular-nums text-accent-primary sm:text-2xl">
          {formatRupees(totalPaise)}
        </span>
      </div>
    </section>
  );
}
