import { nanoid } from "nanoid";
import type { WishlistItem } from "@/types/domain";

export interface AddWishlistInput {
  userId: string;
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string;
  priceInPaise: number;
  mrpInPaise: number;
}

export interface WishlistRepo {
  listByUser(userId: string): Promise<WishlistItem[]>;
  has(userId: string, productId: string): Promise<boolean>;
  add(input: AddWishlistInput): Promise<WishlistItem>;
  remove(userId: string, productId: string): Promise<void>;
}

declare global {
  var __mockWishlist: Map<string, WishlistItem> | undefined;
}

const items: Map<string, WishlistItem> =
  globalThis.__mockWishlist ?? (globalThis.__mockWishlist = new Map());

function key(userId: string, productId: string): string {
  return `${userId}#${productId}`;
}

export const wishlistRepo: WishlistRepo = {
  async listByUser(userId) {
    return [...items.values()]
      .filter((w) => w.userId === userId)
      .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
  },

  async has(userId, productId) {
    return items.has(key(userId, productId));
  },

  async add(input) {
    const k = key(input.userId, input.productId);
    const existing = items.get(k);
    if (existing) return existing;
    const item: WishlistItem = {
      id: `wl_${nanoid(12)}`,
      ...input,
      addedAt: new Date().toISOString(),
    };
    items.set(k, item);
    return item;
  },

  async remove(userId, productId) {
    items.delete(key(userId, productId));
  },
};

export function __resetWishlistRepo(): void {
  items.clear();
}
