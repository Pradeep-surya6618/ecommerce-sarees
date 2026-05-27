import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { clearGuestSessionCookie } from "@/lib/cart/clear-guest-session";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo } from "@/lib/db/repos/cart";
import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { checkRateLimits, getClientIp } from "@/lib/rate-limit/check";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "oauth_google_state";

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  email?: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
}

function loginRedirect(error: string): Response {
  const url = new URL("/auth/login", env.NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

// Google bounces back here with `code` (success) or `error` (cancellation).
// We verify the state cookie, exchange the code for an access token, pull the
// user's email + name from the userinfo endpoint, then issue a session.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    // User clicked Cancel / Deny on Google's consent screen.
    return loginRedirect("google_cancelled");
  }
  if (!code || !state) {
    return loginRedirect("google_failed");
  }

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(STATE_COOKIE);
  if (!stateCookie || stateCookie.value !== state) {
    return loginRedirect("google_state_mismatch");
  }

  // Per-IP throttle on the callback to keep token-exchange noise bounded even
  // if an attacker forges valid-looking state cookies on different sessions.
  const ip = await getClientIp();
  const check = await checkRateLimits([
    { scope: "google", kind: "ip", key: ip, max: 10, windowSeconds: 15 * 60 },
  ]);
  if (!check.ok) {
    return loginRedirect("rate_limit");
  }

  const redirectUri = `${env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`;

  let tokenJson: GoogleTokenResponse;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    tokenJson = (await tokenRes.json()) as GoogleTokenResponse;
  } catch (err) {
    logger.error({ err }, "Google token exchange threw");
    return loginRedirect("google_failed");
  }

  if (!tokenJson.access_token || tokenJson.error) {
    logger.error({ tokenJson }, "Google token exchange returned no access_token");
    return loginRedirect("google_failed");
  }

  let profile: GoogleUserInfo;
  try {
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    profile = (await infoRes.json()) as GoogleUserInfo;
  } catch (err) {
    logger.error({ err }, "Google userinfo fetch threw");
    return loginRedirect("google_failed");
  }

  if (!profile.email) {
    logger.error({ profile }, "Google userinfo returned no email");
    return loginRedirect("google_no_email");
  }

  const user = await usersRepo.findOrCreateGoogle({
    email: profile.email,
    // Fall back to the local part of the email if Google omits `name` —
    // shouldn't happen with the `profile` scope but keeps the type clean.
    fullName: profile.name?.trim() || profile.email.split("@")[0] || profile.email,
  });

  if (user.blocked) {
    return loginRedirect("blocked");
  }

  const session = await sessionsRepo.create(user.id);
  await setSessionCookie("customer", session.id);

  const guestSessionId = await getGuestSessionId();
  if (guestSessionId) {
    await cartRepo.mergeGuestIntoUser(guestSessionId, user.id);
    await clearGuestSessionCookie();
  } else {
    await cartRepo.getOrCreateForUser(user.id);
  }

  revalidatePath("/", "layout");

  const response = NextResponse.redirect(new URL("/account", env.NEXT_PUBLIC_SITE_URL));
  // One-shot cookie — clear it as soon as we're done with it.
  response.cookies.set(STATE_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
