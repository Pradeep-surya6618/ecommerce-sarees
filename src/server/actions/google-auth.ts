"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { clearGuestSessionCookie } from "@/lib/cart/clear-guest-session";
import { ensureGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo } from "@/lib/db/repos/cart";
import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";

// Two fixed demo Google accounts. Real OAuth replaces this in a later phase.
export const DEMO_GOOGLE_ACCOUNTS = [
  { email: "demo+priya@gmail.com", fullName: "Priya Sharma" },
  { email: "demo+anita@gmail.com", fullName: "Anita Iyer" },
] as const;

export type DemoGoogleEmail = (typeof DEMO_GOOGLE_ACCOUNTS)[number]["email"];

export async function googleSignInAction(email: DemoGoogleEmail): Promise<void> {
  const account = DEMO_GOOGLE_ACCOUNTS.find((a) => a.email === email);
  if (!account) {
    throw new Error("Unknown demo Google account.");
  }
  const user = await usersRepo.findOrCreateGoogle({
    email: account.email,
    fullName: account.fullName,
  });
  const session = await sessionsRepo.create(user.id);
  await setSessionCookie(session.id);

  // Merge guest cart if present, then clear the guest cookie.
  const guestSessionId = await ensureGuestSessionId();
  if (guestSessionId) {
    await cartRepo.mergeGuestIntoUser(guestSessionId, user.id);
    await clearGuestSessionCookie();
  }
  revalidatePath("/", "layout");
  redirect("/account");
}
