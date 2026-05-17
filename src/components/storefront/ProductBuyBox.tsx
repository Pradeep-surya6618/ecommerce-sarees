"use client";

import { useState } from "react";
import { addToCartAction } from "@/server/actions/cart";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { PriceTag } from "@/components/ui/PriceTag";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { VariantPicker } from "@/components/ui/VariantPicker";
import type { Product } from "@/types/domain";

export function ProductBuyBox({ product }: { product: Product }) {
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0] ?? null;
  const [selectedSku, setSelectedSku] = useState<string | null>(firstInStock?.sku ?? null);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = product.variants.find((v) => v.sku === selectedSku) ?? null;
  const inStock = (selectedVariant?.stock ?? 0) > 0;
  const maxQty = Math.max(1, Math.min(10, selectedVariant?.stock ?? 0));
  const primaryImage = product.images[0]?.url ?? "";

  async function handleAdd({ variantSku, quantity }: { variantSku: string; quantity: number }) {
    if (!selectedVariant) return;
    await addToCartAction({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantSku,
      variantLabel: selectedVariant.size
        ? `${selectedVariant.colorName} · ${selectedVariant.size}`
        : selectedVariant.colorName,
      imageUrl: primaryImage,
      unitPricePaise: product.priceInPaise,
      unitMrpPaise: product.mrpInPaise,
      quantity,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PriceTag priceInPaise={product.priceInPaise} mrpInPaise={product.mrpInPaise} size="lg" />
      <VariantPicker
        variants={product.variants}
        selectedSku={selectedSku}
        onChange={(sku) => {
          setSelectedSku(sku);
          setQuantity(1);
        }}
      />
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-700">Quantity</span>
        <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={maxQty} />
      </div>
      <div className="flex flex-col gap-2">
        {inStock ? (
          <span className="text-sm text-success">In stock · ready to ship</span>
        ) : (
          <span className="text-sm text-danger">Currently out of stock</span>
        )}
        <AddToCartButton
          productName={product.name}
          variantSku={selectedSku}
          quantity={quantity}
          onAdd={handleAdd}
          disabled={!inStock}
          fullWidth
        />
      </div>
    </div>
  );
}
