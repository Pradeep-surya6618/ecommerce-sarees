"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ensureGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo, type AddItemInput } from "@/lib/db/repos/cart";

export async function addToCartAction(input: AddItemInput): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await cartRepo.addItemAsUser(user.id, input);
  } else {
    const guestSessionId = await ensureGuestSessionId();
    await cartRepo.addItem(guestSessionId, input);
  }
  revalidatePath("/", "layout");
}

export async function updateCartItemAction(itemId: string, quantity: number): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await cartRepo.updateQuantityAsUser(user.id, itemId, quantity);
  } else {
    const guestSessionId = await ensureGuestSessionId();
    await cartRepo.updateQuantity(guestSessionId, itemId, quantity);
  }
  revalidatePath("/", "layout");
}

export async function removeCartItemAction(itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await cartRepo.removeItemAsUser(user.id, itemId);
  } else {
    const guestSessionId = await ensureGuestSessionId();
    await cartRepo.removeItem(guestSessionId, itemId);
  }
  revalidatePath("/", "layout");
}

export async function clearCartAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await cartRepo.clearAsUser(user.id);
  } else {
    const guestSessionId = await ensureGuestSessionId();
    await cartRepo.clear(guestSessionId);
  }
  revalidatePath("/", "layout");
}
