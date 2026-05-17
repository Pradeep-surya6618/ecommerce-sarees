import Image from "next/image";
import { formatRupees } from "@/lib/money";
import { CartSummary } from "@/components/storefront/CartSummary";
import type { Cart } from "@/types/domain";

export interface CheckoutSummaryProps {
  cart: Cart;
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
}

export function CheckoutSummary({
  cart,
  subtotalPaise,
  shippingPaise,
  taxPaise,
  totalPaise,
}: CheckoutSummaryProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="mb-4 font-display text-2xl text-ink-900">In your cart</h2>
        <ul className="flex flex-col gap-4">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm bg-ink-500/5">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col text-sm">
                <span className="font-medium text-ink-900">{item.productName}</span>
                <span className="text-xs text-ink-500">
                  {item.variantLabel} · Qty {item.quantity}
                </span>
                <span className="mt-1 font-semibold tabular-nums text-ink-900">
                  {formatRupees(item.unitPricePaise * item.quantity)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <CartSummary
        subtotalPaise={subtotalPaise}
        shippingPaise={shippingPaise}
        taxPaise={taxPaise}
        totalPaise={totalPaise}
      />
    </div>
  );
}
