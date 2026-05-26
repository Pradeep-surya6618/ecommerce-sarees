"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { ordersRepo } from "@/lib/db/repos/orders";
import type { OrderStatus, User } from "@/types/domain";

export type OrderActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true, user };
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<OrderActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const updated = await ordersRepo.updateStatus(orderId, status);
    if (!updated) return { ok: false, error: "Order not found." };
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update order.";
    return { ok: false, error: message };
  }
}

export async function refundOrderAction(orderId: string): Promise<OrderActionResult> {
  // Stub: marks the order as cancelled. Real refund flow (Razorpay refund call,
  // accounting hooks) lands when payments integration is wired.
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const updated = await ordersRepo.updateStatus(orderId, "cancelled");
    if (!updated) return { ok: false, error: "Order not found." };
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to refund order.";
    return { ok: false, error: message };
  }
}

export async function addOrderNoteAction(
  orderId: string,
  body: string,
): Promise<OrderActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!body.trim()) {
    return { ok: false, error: "Note can't be empty." };
  }
  try {
    const updated = await ordersRepo.addInternalNote(orderId, {
      authorId: auth.user.id,
      authorName: auth.user.fullName,
      body: body.trim(),
    });
    if (!updated) return { ok: false, error: "Order not found." };
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add note.";
    return { ok: false, error: message };
  }
}
