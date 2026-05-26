import { cookies } from "next/headers";

// Two completely separate session cookies — admins and customers are different
// audiences with different threat models, and a single shared cookie meant
// signing into /admin would log you in everywhere on the storefront.
//
//   admin_session    → /admin/* gating
//   customer_session → /account/*, cart, wishlist, etc.
//
// Both can be held by the same browser simultaneously. The customer logging
// out doesn't kick the admin and vice versa.
export const ADMIN_SESSION_COOKIE = "admin_session";
export const CUSTOMER_SESSION_COOKIE = "customer_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type Audience = "admin" | "customer";

function cookieNameFor(audience: Audience): string {
  return audience === "admin" ? ADMIN_SESSION_COOKIE : CUSTOMER_SESSION_COOKIE;
}

export async function getSessionCookie(audience: Audience): Promise<string | null> {
  const store = await cookies();
  return store.get(cookieNameFor(audience))?.value ?? null;
}

export async function setSessionCookie(audience: Audience, sessionId: string): Promise<void> {
  const store = await cookies();
  store.set(cookieNameFor(audience), sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie(audience: Audience): Promise<void> {
  const store = await cookies();
  store.delete(cookieNameFor(audience));
}
