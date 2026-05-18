"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hashPasswordStub, verifyPasswordStub } from "@/lib/auth/passwords";
import { usersRepo } from "@/lib/db/repos/users";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in.");
  return user;
}

export interface UpdateNameInput {
  fullName: string;
}

export async function updateNameAction(input: UpdateNameInput): Promise<void> {
  const user = await requireUser();
  const fullName = input.fullName.trim();
  if (fullName.length < 2) throw new Error("Name must be at least 2 characters.");
  const stored = await usersRepo.findById(user.id);
  if (!stored) throw new Error("Account not found.");
  stored.fullName = fullName;
  stored.updatedAt = new Date().toISOString();
  revalidatePath("/", "layout");
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function changePasswordAction(input: ChangePasswordInput): Promise<void> {
  const user = await requireUser();
  const stored = await usersRepo.findById(user.id);
  if (!stored) throw new Error("Account not found.");
  const ok = await verifyPasswordStub(input.currentPassword, stored.passwordHash);
  if (!ok) throw new Error("Current password is incorrect.");
  if (input.newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
  const newHash = await hashPasswordStub(input.newPassword);
  await usersRepo.updatePasswordHash(user.id, newHash);
  revalidatePath("/", "layout");
}
