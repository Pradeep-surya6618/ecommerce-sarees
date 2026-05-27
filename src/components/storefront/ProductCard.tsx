"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { PriceTag } from "@/components/ui/PriceTag";
import type { Product } from "@/types/domain";
import { WishlistButton } from "./WishlistButton";

export interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
  isInWishlist?: boolean;
}

// Real rating from the denormalised aggregate on the product. Returns null
// when the product has no reviews yet so the card can hide the chip.
function averageRating(product: Product): number | null {
  const count = product.ratingCount ?? 0;
  const sum = product.ratingSum ?? 0;
  if (count <= 0) return null;
  return Math.round((sum / count) * 10) / 10;
}

export function ProductCard({ product, priority, className, isInWishlist }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const primaryImage = product.images[0];
  const secondaryImage = product.images[1] ?? primaryImage;
  const currentImage = hovered ? secondaryImage : primaryImage;

  if (!primaryImage || !currentImage) return null;

  const hasDiscount = product.mrpInPaise > product.priceInPaise;
  const discountPct = hasDiscount
    ? Math.round(((product.mrpInPaise - product.priceInPaise) / product.mrpInPaise) * 100)
    : 0;
  const rating = averageRating(product);

  return (
    <Link
      href={`/product/${product.slug}`}
      className={clsx("group relative flex flex-col gap-3", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-ink-900">
        <Image
          src={currentImage.url}
          alt={currentImage.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />

        {/* Discount badge — top-left */}
        {hasDiscount && (
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center rounded-sm bg-accent-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
            {discountPct}% OFF
          </span>
        )}

        {/* Wishlist heart — top-right */}
        <div className="absolute right-3 top-3">
          <WishlistButton
            // Re-key on the server-fetched membership so the button's local
            // state resets to match after navigation / revalidation.
            key={isInWishlist ? "on" : "off"}
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            imageUrl={primaryImage.url}
            priceInPaise={product.priceInPaise}
            mrpInPaise={product.mrpInPaise}
            initiallyOn={isInWishlist}
          />
        </div>

        {/* Rating chip — bottom-right, only once the product has reviews */}
        {rating !== null && (
          <span
            aria-label={`Rated ${rating} out of 5`}
            className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-sm bg-bg-elevated/95 px-2 py-1 text-xs font-semibold tabular-nums text-ink-900 shadow-sm backdrop-blur"
          >
            {rating.toFixed(1)}
            <Star className="h-3 w-3 fill-accent-gold text-accent-gold" />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
        <h3 className="font-display text-sm font-semibold leading-tight text-ink-900 sm:text-lg">
          {product.name}
        </h3>
        <span className="text-[10px] uppercase tracking-[0.16em] text-ink-500 sm:text-xs sm:tracking-wide">
          {product.fabric}
        </span>
        <div className="mt-0.5 flex items-center justify-between gap-2 sm:mt-1">
          <PriceTag priceInPaise={product.priceInPaise} mrpInPaise={product.mrpInPaise} size="sm" />
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
        </div>
      </div>
    </Link>
  );
}
