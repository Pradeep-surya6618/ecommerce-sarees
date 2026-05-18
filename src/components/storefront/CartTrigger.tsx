import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { Cart } from "@/types/domain";

export interface CartTriggerProps {
  cart: Cart;
}

export function CartTrigger({ cart }: CartTriggerProps) {
  const count = cart.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <Link
      href="/cart"
      aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-700 transition hover:bg-ink-900/5 hover:text-ink-900"
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-semibold tabular-nums text-white"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
