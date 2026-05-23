"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyPasswordStub } from "@/lib/auth/passwords";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session-cookie";
import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";

export interface AdminLoginInput {
  email: string;
  password: string;
}

export async function adminLoginAction(input: AdminLoginInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (!user) throw new Error("Email or password is incorrect.");
  const ok = await verifyPasswordStub(input.password, user.passwordHash);
  if (!ok) throw new Error("Email or password is incorrect.");
  if (user.role !== "admin" && user.role !== "staff") {
    throw new Error("This account does not have admin access.");
  }
  if (!user.emailVerified) {
    // Force-verify staff/admin users on first login so the demo works
    // even when the seed bypasses the OTP step.
    await usersRepo.markEmailVerified(user.id);
  }
  const session = await sessionsRepo.create(user.id);
  await setSessionCookie(session.id);
  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

export async function adminLogoutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}
