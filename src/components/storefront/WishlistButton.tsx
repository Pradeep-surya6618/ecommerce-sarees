"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import { addToWishlistAction, removeFromWishlistAction } from "@/server/actions/wishlist";

export interface WishlistButtonProps {
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string;
  priceInPaise: number;
  mrpInPaise: number;
  initiallyOn?: boolean;
  className?: string;
}

export function WishlistButton({
  productId,
  productSlug,
  productName,
  imageUrl,
  priceInPaise,
  mrpInPaise,
  initiallyOn = false,
  className,
}: WishlistButtonProps) {
  const [on, setOn] = useState(initiallyOn);
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        if (on) {
          await removeFromWishlistAction(productId);
          setOn(false);
          toast.success("Removed from wishlist");
        } else {
          await addToWishlistAction({
            productId,
            productSlug,
            productName,
            imageUrl,
            priceInPaise,
            mrpInPaise,
          });
          setOn(true);
          toast.success("Added to wishlist");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sign in to use the wishlist.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={on}
      className={clsx(
        "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border bg-bg-elevated/90 backdrop-blur transition disabled:cursor-not-allowed disabled:opacity-70",
        on
          ? "border-accent-primary text-accent-primary"
          : "border-ink-500/20 text-ink-700 hover:border-ink-900 hover:text-ink-900",
        className,
      )}
    >
      <Heart className={clsx("h-4 w-4", on && "fill-current")} />
    </button>
  );
}
