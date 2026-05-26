"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ensureGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo, type AddItemInput } from "@/lib/db/repos/cart";

export type CartActionResult = { ok: true } | { ok: false; error: string };

export async function addToCartAction(input: AddItemInput): Promise<CartActionResult> {
  try {
    const user = await getCurrentUser();
    if (user) {
      await cartRepo.addItemAsUser(user.id, input);
    } else {
      const guestSessionId = await ensureGuestSessionId();
      await cartRepo.addItem(guestSessionId, input);
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add item to cart.";
    return { ok: false, error: message };
  }
}

export async function updateCartItemAction(
  itemId: string,
  quantity: number,
): Promise<CartActionResult> {
  try {
    const user = await getCurrentUser();
    if (user) {
      await cartRepo.updateQuantityAsUser(user.id, itemId, quantity);
    } else {
      const guestSessionId = await ensureGuestSessionId();
      await cartRepo.updateQuantity(guestSessionId, itemId, quantity);
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update quantity.";
    return { ok: false, error: message };
  }
}

export async function removeCartItemAction(itemId: string): Promise<CartActionResult> {
  try {
    const user = await getCurrentUser();
    if (user) {
      await cartRepo.removeItemAsUser(user.id, itemId);
    } else {
      const guestSessionId = await ensureGuestSessionId();
      await cartRepo.removeItem(guestSessionId, itemId);
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove item.";
    return { ok: false, error: message };
  }
}

export async function clearCartAction(): Promise<CartActionResult> {
  try {
    const user = await getCurrentUser();
    if (user) {
      await cartRepo.clearAsUser(user.id);
    } else {
      const guestSessionId = await ensureGuestSessionId();
      await cartRepo.clear(guestSessionId);
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clear cart.";
    return { ok: false, error: message };
  }
}
