"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { wishlistRepo, type AddWishlistInput } from "@/lib/db/repos/wishlist";

export type WishlistResult = { ok: true } | { ok: false; error: string };

export type AddWishlistActionInput = Omit<AddWishlistInput, "userId">;

export async function addToWishlistAction(input: AddWishlistActionInput): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please sign in to use your wishlist." };
  }
  await wishlistRepo.add({ ...input, userId: user.id });
  revalidatePath("/account/wishlist");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeFromWishlistAction(productId: string): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please sign in to use your wishlist." };
  }
  await wishlistRepo.remove(user.id, productId);
  revalidatePath("/account/wishlist");
  revalidatePath("/", "layout");
  return { ok: true };
}
