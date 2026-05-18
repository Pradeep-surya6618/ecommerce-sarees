"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ordersRepo } from "@/lib/db/repos/orders";
import type { OrderStatus } from "@/types/domain";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    throw new Error("Admin access required.");
  }
  return user;
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<void> {
  await requireAdmin();
  await ordersRepo.updateStatus(orderId, status);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function refundOrderAction(orderId: string): Promise<void> {
  // Stub: set status to "cancelled" (real refund flow lands later)
  await requireAdmin();
  await ordersRepo.updateStatus(orderId, "cancelled");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function addOrderNoteAction(orderId: string, body: string): Promise<void> {
  const user = await requireAdmin();
  await ordersRepo.addInternalNote(orderId, {
    authorId: user.id,
    authorName: user.fullName,
    body,
  });
  revalidatePath(`/admin/orders/${orderId}`);
}
