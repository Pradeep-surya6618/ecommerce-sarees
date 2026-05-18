import { usersRepo } from "@/lib/db/repos/users";
import { hashPasswordStub } from "./passwords";

declare global {
  var __adminSeeded: boolean | undefined;
}

export const DEMO_ADMIN_EMAIL = "admin@example.com";
export const DEMO_ADMIN_PASSWORD = "AdminDemo!23";

export async function ensureDemoAdminSeeded(): Promise<void> {
  if (globalThis.__adminSeeded) return;
  const existing = await usersRepo.findByEmail(DEMO_ADMIN_EMAIL);
  if (existing) {
    if (existing.role !== "admin") {
      await usersRepo.promoteToAdmin(existing.id);
    }
    globalThis.__adminSeeded = true;
    return;
  }
  const passwordHash = await hashPasswordStub(DEMO_ADMIN_PASSWORD);
  const user = await usersRepo.create({
    email: DEMO_ADMIN_EMAIL,
    fullName: "Demo Admin",
    passwordHash,
  });
  await usersRepo.markEmailVerified(user.id);
  await usersRepo.promoteToAdmin(user.id);
  globalThis.__adminSeeded = true;
}
