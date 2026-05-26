import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";
import type { User } from "@/types/domain";
import { getSessionCookie } from "./session-cookie";

// Storefront user — reads the customer-only cookie. Returns null when
// nobody is signed in OR when the signed-in user is an admin/staff (admins
// browse the storefront as anonymous unless they also sign in as a customer).
export async function getCurrentUser(): Promise<User | null> {
  const sessionId = await getSessionCookie("customer");
  if (!sessionId) return null;
  const session = await sessionsRepo.findById(sessionId);
  if (!session) return null;
  const user = await usersRepo.findById(session.userId);
  if (!user) return null;
  // Defence in depth — even if an admin somehow had the customer cookie,
  // refuse to expose them on the storefront. Forces explicit customer login.
  if (user.role !== "customer") return null;
  return user;
}

// Admin / staff user — reads the admin-only cookie. Returns null unless
// the role is admin or staff (defence against role escalation if a non-admin
// somehow obtained the admin cookie).
export async function getCurrentAdminUser(): Promise<User | null> {
  const sessionId = await getSessionCookie("admin");
  if (!sessionId) return null;
  const session = await sessionsRepo.findById(sessionId);
  if (!session) return null;
  const user = await usersRepo.findById(session.userId);
  if (!user) return null;
  if (user.role !== "admin" && user.role !== "staff") return null;
  return user;
}
