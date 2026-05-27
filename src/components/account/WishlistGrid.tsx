"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeFromWishlistAction } from "@/server/actions/wishlist";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PriceTag } from "@/components/ui/PriceTag";
import type { Product, WishlistItem } from "@/types/domain";

// Real rating from the product's denormalised aggregate — mirrors ProductCard.
// Null when there are no reviews yet (or the product isn't loaded), so the
// card hides the rating chip.
function averageRating(product: Product | undefined): number | null {
  const count = product?.ratingCount ?? 0;
  const sum = product?.ratingSum ?? 0;
  if (count <= 0) return null;
  return Math.round((sum / count) * 10) / 10;
}

export interface WishlistGridProps {
  items: WishlistItem[];
  productById: Record<string, Product>;
}

export function WishlistGrid({ items, productById }: WishlistGridProps) {
  const [pending, startTransition] = useTransition();
  const [confirmItem, setConfirmItem] = useState<WishlistItem | null>(null);

  function confirmRemove() {
    if (!confirmItem) return;
    const target = confirmItem;
    startTransition(async () => {
      try {
        const result = await removeFromWishlistAction(target.productId);
        if (!result.ok) {
          setConfirmItem(null);
          toast.error("Couldn't remove from wishlist", { description: result.error });
          return;
        }
        toast.success("Removed from wishlist", {
          description: `"${target.productName}" is no longer saved.`,
        });
        // If the row unmounts via revalidation, this is a no-op.
        setConfirmItem(null);
      } catch {
        setConfirmItem(null);
        toast.error("Couldn't remove from wishlist", {
          description: "Please try again.",
        });
      }
    });
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3">
      {items.map((item) => {
        const product = productById[item.productId];
        const priceInPaise = product?.priceInPaise ?? item.priceInPaise;
        const mrpInPaise = product?.mrpInPaise ?? item.mrpInPaise;
        const hasDiscount = mrpInPaise > priceInPaise;
        const discountPct = hasDiscount
          ? Math.round(((mrpInPaise - priceInPaise) / mrpInPaise) * 100)
          : 0;
        const rating = averageRating(product);
        const imageUrl = product?.images[0]?.url ?? item.imageUrl;

        return (
          <div key={item.id} className="group relative flex flex-col gap-2 sm:gap-3">
            <Link href={`/product/${item.productSlug}`} className="flex flex-col gap-2 sm:gap-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-ink-900">
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={item.productName}
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                )}

                {/* Discount badge — top-left */}
                {hasDiscount && (
                  <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center rounded-sm bg-accent-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm sm:left-3 sm:top-3 sm:px-2 sm:py-1 sm:text-[10px]">
                    {discountPct}% OFF
                  </span>
                )}

                {/* Rating chip — bottom-right, only once the product has reviews */}
                {rating !== null && (
                  <span
                    aria-label={`Rated ${rating} out of 5`}
                    className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-sm bg-bg-elevated/95 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink-900 shadow-sm backdrop-blur sm:bottom-3 sm:right-3 sm:px-2 sm:py-1 sm:text-xs"
                  >
                    {rating.toFixed(1)}
                    <Star className="h-2.5 w-2.5 fill-accent-gold text-accent-gold sm:h-3 sm:w-3" />
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 sm:gap-1">
                <h3 className="truncate font-display text-sm text-ink-900 sm:text-lg">
                  {item.productName}
                </h3>
                {product?.fabric && (
                  <span className="text-[10px] uppercase tracking-wide text-ink-500 sm:text-xs">
                    {product.fabric}
                  </span>
                )}
                <div className="mt-0.5 flex items-center justify-between gap-2 sm:mt-1">
                  <PriceTag priceInPaise={priceInPaise} mrpInPaise={mrpInPaise} size="sm" />
                  {product && product.variants.length > 0 && (
                    <div className="flex items-center gap-1">
                      {product.variants.slice(0, 4).map((v) => (
                        <span
                          key={v.sku}
                          aria-label={v.colorName}
                          title={v.colorName}
                          className="h-2.5 w-2.5 rounded-full border border-ink-500/30 sm:h-3 sm:w-3"
                          style={{ background: v.colorHex }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Remove (trash) — top-right */}
            <button
              type="button"
              aria-label="Remove from wishlist"
              onClick={() => setConfirmItem(item)}
              disabled={pending}
              className="absolute right-2 top-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-ink-900 text-bg-base shadow-md transition hover:bg-danger disabled:cursor-not-allowed disabled:opacity-50 sm:right-3 sm:top-3 sm:h-9 sm:w-9"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        );
      })}

      {/* Shared delete confirmation (single instance, content swaps with target) */}
      <ConfirmDialog
        open={confirmItem !== null}
        onClose={() => {
          if (!pending) setConfirmItem(null);
        }}
        onConfirm={confirmRemove}
        title="Remove from wishlist?"
        description={
          confirmItem
            ? `"${confirmItem.productName}" will be removed from your saved sarees.`
            : undefined
        }
        confirmLabel="Remove"
        cancelLabel="Keep it"
        tone="danger"
        icon={Trash2}
        pending={pending}
      />
    </div>
  );
}
