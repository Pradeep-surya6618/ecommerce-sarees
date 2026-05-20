import Image from "next/image";
import { ShoppingBag } from "lucide-react";
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
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* In your cart */}
      <section className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-5 md:p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <header className="mb-4 flex items-center gap-3 sm:mb-5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
            <ShoppingBag className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
              Items
            </span>
            <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
              In your cart
            </h2>
          </div>
        </header>

        <ul className="flex flex-col gap-3 sm:gap-4">
          {cart.items.map((item) => (
            <li key={item.id} className="flex min-w-0 items-start gap-3">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-ink-900 sm:h-[72px] sm:w-16">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-ink-900 sm:text-[15px]">
                  {item.productName}
                </span>
                <span className="truncate text-[10px] uppercase tracking-[0.18em] text-ink-500 sm:text-[11px]">
                  {item.variantLabel} · Qty {item.quantity}
                </span>
                <span className="mt-0.5 text-sm font-semibold tabular-nums text-ink-900 sm:text-base">
                  {formatRupees(item.unitPricePaise * item.quantity)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Totals — reuses the cart summary card */}
      <CartSummary
        subtotalPaise={subtotalPaise}
        shippingPaise={shippingPaise}
        taxPaise={taxPaise}
        totalPaise={totalPaise}
      />
    </div>
  );
}
