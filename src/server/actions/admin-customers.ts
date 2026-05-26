"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { usersRepo } from "@/lib/db/repos/users";

export type CustomerActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

export async function blockCustomerAction(userId: string): Promise<CustomerActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const updated = await usersRepo.blockUser(userId);
    if (!updated) return { ok: false, error: "Customer not found." };
    revalidatePath(`/admin/customers/${userId}`);
    revalidatePath("/admin/customers");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to block customer.";
    return { ok: false, error: message };
  }
}

export async function unblockCustomerAction(userId: string): Promise<CustomerActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const updated = await usersRepo.unblockUser(userId);
    if (!updated) return { ok: false, error: "Customer not found." };
    revalidatePath(`/admin/customers/${userId}`);
    revalidatePath("/admin/customers");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to unblock customer.";
    return { ok: false, error: message };
  }
}
