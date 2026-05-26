import { nanoid } from "nanoid";
import { usersRepo } from "@/lib/db/repos/users";
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

// Wishlist is stored as an embedded array on the User item. Each call does
// a Get → mutate → Put cycle; concurrent updates from the same user on
// different devices could lose data, but customers rarely add/remove from
// two devices simultaneously. If that becomes a problem we can switch to
// conditional updates with a version attribute.

function nowIso(): string {
  return new Date().toISOString();
}

function sortNewestFirst(a: WishlistItem, b: WishlistItem): number {
  return a.addedAt < b.addedAt ? 1 : a.addedAt > b.addedAt ? -1 : 0;
}

export const wishlistRepo: WishlistRepo = {
  async listByUser(userId) {
    const user = await usersRepo.findById(userId);
    if (!user) return [];
    return (user.wishlist ?? []).slice().sort(sortNewestFirst);
  },

  async has(userId, productId) {
    const user = await usersRepo.findById(userId);
    if (!user) return false;
    return (user.wishlist ?? []).some((w) => w.productId === productId);
  },

  async add(input) {
    const user = await usersRepo.findById(input.userId);
    if (!user) throw new Error("User not found.");
    const current = user.wishlist ?? [];
    const existing = current.find((w) => w.productId === input.productId);
    if (existing) return existing;
    const item: WishlistItem = {
      id: `wl_${nanoid(12)}`,
      userId: input.userId,
      productId: input.productId,
      productSlug: input.productSlug,
      productName: input.productName,
      imageUrl: input.imageUrl,
      priceInPaise: input.priceInPaise,
      mrpInPaise: input.mrpInPaise,
      addedAt: nowIso(),
    };
    await usersRepo.setWishlist(input.userId, [...current, item]);
    return item;
  },

  async remove(userId, productId) {
    const user = await usersRepo.findById(userId);
    if (!user) return;
    const current = user.wishlist ?? [];
    const next = current.filter((w) => w.productId !== productId);
    if (next.length === current.length) return; // nothing to remove
    await usersRepo.setWishlist(userId, next);
  },
};
