"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { wishlistRepo, type AddWishlistInput } from "@/lib/db/repos/wishlist";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in to use your wishlist.");
  return user;
}

export type AddWishlistActionInput = Omit<AddWishlistInput, "userId">;

export async function addToWishlistAction(input: AddWishlistActionInput): Promise<void> {
  const user = await requireUser();
  await wishlistRepo.add({ ...input, userId: user.id });
  revalidatePath("/account/wishlist");
  revalidatePath("/", "layout");
}

export async function removeFromWishlistAction(productId: string): Promise<void> {
  const user = await requireUser();
  await wishlistRepo.remove(user.id, productId);
  revalidatePath("/account/wishlist");
  revalidatePath("/", "layout");
}
