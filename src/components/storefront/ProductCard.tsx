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
}

// Deterministic 4.0–5.0 rating from the product id so each card is stable but varied.
// Will be replaced by real review aggregation when the backend lands.
function pseudoRating(productId: string): number {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) | 0;
  }
  const variance = (Math.abs(hash) % 11) / 10;
  return Math.round((4.0 + variance) * 10) / 10;
}

export function ProductCard({ product, priority, className }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const primaryImage = product.images[0];
  const secondaryImage = product.images[1] ?? primaryImage;
  const currentImage = hovered ? secondaryImage : primaryImage;

  if (!primaryImage || !currentImage) return null;

  const hasDiscount = product.mrpInPaise > product.priceInPaise;
  const discountPct = hasDiscount
    ? Math.round(((product.mrpInPaise - product.priceInPaise) / product.mrpInPaise) * 100)
    : 0;
  const rating = pseudoRating(product.id);

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
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            imageUrl={primaryImage.url}
            priceInPaise={product.priceInPaise}
            mrpInPaise={product.mrpInPaise}
          />
        </div>

        {/* Rating chip — bottom-right */}
        <span
          aria-label={`Rated ${rating} out of 5`}
          className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-sm bg-bg-elevated/95 px-2 py-1 text-xs font-semibold tabular-nums text-ink-900 shadow-sm backdrop-blur"
        >
          {rating.toFixed(1)}
          <Star className="h-3 w-3 fill-accent-gold text-accent-gold" />
        </span>
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
