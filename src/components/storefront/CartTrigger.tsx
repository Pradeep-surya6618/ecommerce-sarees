import Link from "next/link";
import { HandbagIcon } from "@/components/shared/icons";
import { NavTooltip } from "@/components/shared/NavTooltip";
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
      className="group relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-900/[0.06] hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
    >
      <HandbagIcon className="h-[20px] w-[20px]" />
      {count > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-0.5 top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-semibold leading-none tabular-nums text-white ring-2 ring-bg-base"
        >
          {count}
        </span>
      )}
      <NavTooltip label="Cart" />
    </Link>
  );
}
