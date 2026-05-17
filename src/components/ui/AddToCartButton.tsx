"use client";

import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";

export interface AddToCartButtonProps {
  productName: string;
  variantSku: string | null;
  quantity: number;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function AddToCartButton({
  productName,
  variantSku,
  quantity,
  disabled,
  fullWidth,
  className,
}: AddToCartButtonProps) {
  function onClick() {
    if (!variantSku) {
      toast.error("Please choose a variant before adding to cart.");
      return;
    }
    toast.success(`Added ${quantity} × ${productName} to cart`, {
      description: "Cart actions arrive in Phase 3.",
    });
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition",
        "hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        fullWidth && "w-full",
        className,
      )}
    >
      <ShoppingBag className="h-4 w-4" />
      Add to cart
    </button>
  );
}
