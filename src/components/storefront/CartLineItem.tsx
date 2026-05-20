"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatRupees } from "@/lib/money";
import { removeCartItemAction, updateCartItemAction } from "@/server/actions/cart";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { CartItem } from "@/types/domain";

export function CartLineItem({ item }: { item: CartItem }) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const lineTotalPaise = item.unitPricePaise * item.quantity;

  function changeQty(next: number) {
    startTransition(async () => {
      try {
        await updateCartItemAction(item.id, next);
      } catch (err) {
        toast.error("Couldn't update quantity.");
        console.error(err);
      }
    });
  }

  function confirmRemove() {
    startTransition(async () => {
      try {
        await removeCartItemAction(item.id);
        toast.success("Removed from cart", {
          description: `"${item.productName}" is no longer in your cart.`,
        });
        setConfirmOpen(false);
      } catch (err) {
        setConfirmOpen(false);
        toast.error("Couldn't remove the item.", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      }
    });
  }

  return (
    <div className="flex min-w-0 gap-3 py-3.5 sm:gap-4 sm:py-5">
      {/* Thumbnail */}
      <Link
        href={`/product/${item.productSlug}`}
        className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-ink-900 sm:h-28 sm:w-24"
      >
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            fill
            sizes="96px"
            className="object-cover"
          />
        )}
      </Link>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2">
        <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={`/product/${item.productSlug}`}
              className="truncate font-display text-sm leading-tight text-ink-900 transition hover:text-accent-primary sm:text-lg"
            >
              {item.productName}
            </Link>
            <span className="truncate text-[10px] uppercase tracking-[0.18em] text-ink-500 sm:text-xs sm:tracking-wide">
              {item.variantLabel}
            </span>
          </div>
          {/* Delete trigger */}
          <button
            type="button"
            aria-label="Remove from cart"
            onClick={() => setConfirmOpen(true)}
            disabled={pending}
            className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-500 transition hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-8"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <QuantityStepper value={item.quantity} onChange={changeQty} min={1} max={10} />
          <span className="text-sm font-semibold tabular-nums text-ink-900 sm:text-base">
            {formatRupees(lineTotalPaise)}
          </span>
        </div>
      </div>

      {/* Confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (!pending) setConfirmOpen(false);
        }}
        onConfirm={confirmRemove}
        title="Remove from cart?"
        description={`"${item.productName}" will be removed from your cart.`}
        confirmLabel="Remove"
        cancelLabel="Keep it"
        tone="danger"
        icon={Trash2}
        pending={pending}
      />
    </div>
  );
}
