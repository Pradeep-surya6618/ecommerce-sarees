"use client";

import Link from "next/link";
import { formatRupees } from "@/lib/money";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Sheet";
import type { Cart } from "@/types/domain";
import { CartLineItem } from "./CartLineItem";

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: Cart;
  subtotalPaise: number;
}

export function CartDrawer({ open, onClose, cart, subtotalPaise }: CartDrawerProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Cart (${cart.items.length})`}
      side="right"
      footer={
        cart.items.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm text-ink-700">
              <span>Subtotal</span>
              <span className="font-semibold tabular-nums text-ink-900">
                {formatRupees(subtotalPaise)}
              </span>
            </div>
            <p className="text-xs text-ink-500">GST and shipping are added at checkout.</p>
            <div className="flex gap-2">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex-1 rounded-sm border border-ink-900 px-4 py-3 text-center text-sm font-medium text-ink-900 transition hover:bg-ink-900 hover:text-white"
              >
                View cart
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex-1 rounded-sm bg-accent-primary px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-accent-primary-hover"
              >
                Checkout
              </Link>
            </div>
          </div>
        ) : null
      }
    >
      {cart.items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Add a saree from the shop to begin."
          action={
            <Link
              href="/shop"
              onClick={onClose}
              className="mt-2 inline-flex items-center justify-center rounded-sm bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
            >
              Shop sarees
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-ink-500/10">
          {cart.items.map((item) => (
            <li key={item.id}>
              <CartLineItem item={item} />
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
