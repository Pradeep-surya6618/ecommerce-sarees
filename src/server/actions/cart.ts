"use server";

import { revalidatePath } from "next/cache";
import { ensureGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo, type AddItemInput } from "@/lib/db/repos/cart";

export async function addToCartAction(input: AddItemInput): Promise<void> {
  const guestSessionId = await ensureGuestSessionId();
  await cartRepo.addItem(guestSessionId, input);
  revalidatePath("/", "layout");
}

export async function updateCartItemAction(itemId: string, quantity: number): Promise<void> {
  const guestSessionId = await ensureGuestSessionId();
  await cartRepo.updateQuantity(guestSessionId, itemId, quantity);
  revalidatePath("/", "layout");
}

export async function removeCartItemAction(itemId: string): Promise<void> {
  const guestSessionId = await ensureGuestSessionId();
  await cartRepo.removeItem(guestSessionId, itemId);
  revalidatePath("/", "layout");
}

export async function clearCartAction(): Promise<void> {
  const guestSessionId = await ensureGuestSessionId();
  await cartRepo.clear(guestSessionId);
  revalidatePath("/", "layout");
}
