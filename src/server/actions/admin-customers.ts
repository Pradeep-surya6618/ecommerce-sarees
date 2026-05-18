"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { usersRepo } from "@/lib/db/repos/users";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    throw new Error("Admin access required.");
  }
  return user;
}

export async function blockCustomerAction(userId: string): Promise<void> {
  await requireAdmin();
  await usersRepo.blockUser(userId);
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
}

export async function unblockCustomerAction(userId: string): Promise<void> {
  await requireAdmin();
  await usersRepo.unblockUser(userId);
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
}
