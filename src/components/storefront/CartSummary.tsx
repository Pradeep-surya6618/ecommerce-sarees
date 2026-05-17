import { formatRupees } from "@/lib/money";

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
    <div className={className}>
      <div className="flex flex-col gap-3 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-2xl text-ink-900">Order summary</h2>
        <dl className="flex flex-col gap-2 text-sm text-ink-700">
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
            <dd className="tabular-nums">
              {typeof shippingPaise === "number"
                ? shippingPaise === 0
                  ? "Free"
                  : formatRupees(shippingPaise)
                : "Calculated at checkout"}
            </dd>
          </div>
        </dl>
        <div className="mt-2 flex justify-between border-t border-ink-500/10 pt-3 font-display text-xl text-ink-900">
          <span>Total</span>
          <span className="tabular-nums">{formatRupees(totalPaise)}</span>
        </div>
      </div>
    </div>
  );
}
