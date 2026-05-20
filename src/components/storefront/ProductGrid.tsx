import type { Product } from "@/types/domain";
import { ProductCard } from "./ProductCard";

export interface ProductGridProps {
  products: Product[];
  /** Product IDs already in the user's wishlist — drives the filled-heart
   *  state on each card. Pass an empty set (or omit) for guests. */
  wishlistProductIds?: ReadonlySet<string>;
}

export function ProductGrid({ products, wishlistProductIds }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} isInWishlist={wishlistProductIds?.has(p.id) ?? false} />
      ))}
    </div>
  );
}
