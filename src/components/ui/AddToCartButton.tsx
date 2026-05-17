"use client";

import { useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";

export interface AddToCartButtonProps {
  productName: string;
  variantSku: string | null;
  quantity: number;
  onAdd: (input: { variantSku: string; quantity: number }) => Promise<void> | void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function AddToCartButton({
  productName,
  variantSku,
  quantity,
  onAdd,
  disabled,
  fullWidth,
  className,
}: AddToCartButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!variantSku) {
      toast.error("Please choose a variant before adding to cart.");
      return;
    }
    startTransition(async () => {
      try {
        await onAdd({ variantSku, quantity });
        toast.success(`Added ${quantity} × ${productName} to cart`, {
          action: { label: "View cart", onClick: () => (window.location.href = "/cart") },
        });
      } catch (err) {
        toast.error("Couldn't add to cart. Please try again.");
        console.error(err);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={handleClick}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition",
        "hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        fullWidth && "w-full",
        className,
      )}
    >
      <ShoppingBag className="h-4 w-4" />
      {pending ? "Adding…" : "Add to cart"}
    </button>
  );
}
