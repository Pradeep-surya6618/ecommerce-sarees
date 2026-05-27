"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import { usersRepo } from "@/lib/db/repos/users";

export type ProfileResult = { ok: true } | { ok: false; error: string };

export interface UpdateNameInput {
  fullName: string;
}

export async function updateNameAction(input: UpdateNameInput): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const fullName = input.fullName.trim();
  if (fullName.length < 2) {
    return { ok: false, error: "Name must be at least 2 characters." };
  }
  const updated = await usersRepo.updateFullName(user.id, fullName);
  if (!updated) return { ok: false, error: "Account not found." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function changePasswordAction(input: ChangePasswordInput): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const stored = await usersRepo.findById(user.id);
  if (!stored) return { ok: false, error: "Account not found." };
  const ok = await verifyPassword(input.currentPassword, stored.passwordHash);
  if (!ok) return { ok: false, error: "Current password is incorrect." };
  if (input.newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  const newHash = await hashPassword(input.newPassword);
  await usersRepo.updatePasswordHash(user.id, newHash);
  revalidatePath("/", "layout");
  return { ok: true };
}
