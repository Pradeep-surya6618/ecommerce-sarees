"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatRupees } from "@/lib/money";
import { removeCartItemAction, updateCartItemAction } from "@/server/actions/cart";
import { IconButton } from "@/components/ui/IconButton";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { CartItem } from "@/types/domain";

export function CartLineItem({ item }: { item: CartItem }) {
  const [pending, startTransition] = useTransition();
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

  function remove() {
    startTransition(async () => {
      try {
        await removeCartItemAction(item.id);
        toast.success(`Removed ${item.productName}`);
      } catch (err) {
        toast.error("Couldn't remove item.");
        console.error(err);
      }
    });
  }

  return (
    <div className="flex gap-4 py-6">
      <Link
        href={`/product/${item.productSlug}`}
        className="relative h-28 w-24 shrink-0 overflow-hidden rounded-sm bg-ink-500/5"
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
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/product/${item.productSlug}`}
              className="font-display text-lg text-ink-900 transition hover:text-accent-primary"
            >
              {item.productName}
            </Link>
            <span className="text-xs uppercase tracking-wide text-ink-500">
              {item.variantLabel}
            </span>
          </div>
          <IconButton aria-label="Remove" onClick={remove} disabled={pending}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper value={item.quantity} onChange={changeQty} min={1} max={10} />
          <span className="text-base font-semibold tabular-nums text-ink-900">
            {formatRupees(lineTotalPaise)}
          </span>
        </div>
      </div>
    </div>
  );
}
