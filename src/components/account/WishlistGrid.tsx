"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeFromWishlistAction } from "@/server/actions/wishlist";
import { IconButton } from "@/components/ui/IconButton";
import { PriceTag } from "@/components/ui/PriceTag";
import type { WishlistItem } from "@/types/domain";

export function WishlistGrid({ items }: { items: WishlistItem[] }) {
  const [pending, startTransition] = useTransition();

  function removeItem(productId: string) {
    startTransition(async () => {
      try {
        await removeFromWishlistAction(productId);
        toast.success("Removed from wishlist");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="relative">
          <Link href={`/product/${item.productSlug}`} className="group flex flex-col gap-3">
            <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-ink-500/5">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <h3 className="font-display text-lg text-ink-900">{item.productName}</h3>
            <PriceTag priceInPaise={item.priceInPaise} mrpInPaise={item.mrpInPaise} size="sm" />
          </Link>
          <div className="absolute right-3 top-3">
            <IconButton
              aria-label="Remove from wishlist"
              onClick={() => removeItem(item.productId)}
              disabled={pending}
              variant="solid"
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
}
