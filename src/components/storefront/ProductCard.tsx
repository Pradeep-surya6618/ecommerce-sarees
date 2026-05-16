"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "@/lib/utils/clsx";
import { PriceTag } from "@/components/ui/PriceTag";
import type { Product } from "@/types/domain";

export interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority, className }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const primaryImage = product.images[0];
  const secondaryImage = product.images[1] ?? primaryImage;
  const currentImage = hovered ? secondaryImage : primaryImage;

  if (!primaryImage || !currentImage) return null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className={clsx("group flex flex-col gap-3", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-ink-500/5">
        <Image
          src={currentImage.url}
          alt={currentImage.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-lg text-ink-900">{product.name}</h3>
        <span className="text-xs uppercase tracking-wide text-ink-500">{product.fabric}</span>
        <div className="mt-1 flex items-center justify-between">
          <PriceTag priceInPaise={product.priceInPaise} mrpInPaise={product.mrpInPaise} size="sm" />
          <div className="flex items-center gap-1">
            {product.variants.slice(0, 4).map((v) => (
              <span
                key={v.sku}
                aria-label={v.colorName}
                title={v.colorName}
                className="h-3 w-3 rounded-full border border-ink-500/30"
                style={{ background: v.colorHex }}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
