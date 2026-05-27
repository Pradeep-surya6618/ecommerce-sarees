import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { checkRateLimits, getClientIp } from "@/lib/rate-limit/check";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "oauth_google_state";
const STATE_TTL_SECONDS = 600; // 10 minutes — covers slow consent screens

// Kicks off the Google OAuth dance: stash a random nonce in an HttpOnly cookie
// and redirect to Google's authorize endpoint with the same nonce in `state`.
// On the way back, the callback compares the two — that's our CSRF check.
export async function GET(): Promise<Response> {
  const ip = await getClientIp();
  const check = await checkRateLimits([
    { scope: "google-start", kind: "ip", key: ip, max: 20, windowSeconds: 15 * 60 },
  ]);
  if (!check.ok) {
    return NextResponse.redirect(new URL(`/auth/login?error=rate_limit`, env.NEXT_PUBLIC_SITE_URL));
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = `${env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`;

  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "openid email profile");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("access_type", "online");
  // `select_account` always shows the chooser, even if only one Google account
  // is signed in — friendlier than auto-picking the wrong one.
  authorize.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorize);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STATE_TTL_SECONDS,
  });
  return response;
}
