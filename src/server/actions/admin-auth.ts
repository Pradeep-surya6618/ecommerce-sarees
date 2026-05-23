"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/passwords";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session-cookie";
import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";

export interface AdminLoginInput {
  email: string;
  password: string;
}

export type AdminLoginResult = { ok: true } | { ok: false; error: string };

export async function adminLoginAction(input: AdminLoginInput): Promise<AdminLoginResult> {
  const user = await usersRepo.findByEmail(input.email);
  if (!user) return { ok: false, error: "Email or password is incorrect." };

  const passwordOk = await verifyPassword(input.password, user.passwordHash);
  if (!passwordOk) return { ok: false, error: "Email or password is incorrect." };

  if (user.role !== "admin" && user.role !== "staff") {
    return { ok: false, error: "This account does not have admin access." };
  }

  if (user.blocked) {
    return { ok: false, error: "This account has been suspended." };
  }

  if (!user.emailVerified) {
    await usersRepo.markEmailVerified(user.id);
  }

  const session = await sessionsRepo.create(user.id);
  await setSessionCookie(session.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminLogoutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}
