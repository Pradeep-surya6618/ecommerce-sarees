"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import type { Cart } from "@/types/domain";
import { CartDrawer } from "./CartDrawer";

export interface CartTriggerProps {
  cart: Cart;
  subtotalPaise: number;
}

export function CartTrigger({ cart, subtotalPaise }: CartTriggerProps) {
  const [open, setOpen] = useState(false);
  const count = cart.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      <div className="relative">
        <IconButton aria-label="Cart" size="sm" onClick={() => setOpen(true)}>
          <ShoppingBag className="h-5 w-5" />
        </IconButton>
        {count > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-semibold tabular-nums text-white"
          >
            {count}
          </span>
        )}
      </div>
      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
        cart={cart}
        subtotalPaise={subtotalPaise}
      />
    </>
  );
}
