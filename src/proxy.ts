import { NextResponse, type NextRequest } from "next/server";

// Two separate audiences, two separate cookies — must match exactly what
// `setSessionCookie` writes in src/lib/auth/session-cookie.ts. Hard-coded here
// (rather than imported) because this file runs in the edge runtime and we
// avoid pulling cookie-store helpers into it. If you rename a cookie there,
// rename it here too.
const CUSTOMER_SESSION_COOKIE = "customer_session";
const ADMIN_SESSION_COOKIE = "admin_session";

// Lightweight presence check — middleware only gates "definitely signed out";
// the real session validation (DB lookup, expiry, blocked-user check) runs
// server-side in `getCurrentUser` / `getCurrentAdminUser` on each protected
// page. A forged cookie that passes this check still gets rejected there.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAdmin = path.startsWith("/admin");
  const cookieName = isAdmin ? ADMIN_SESSION_COOKIE : CUSTOMER_SESSION_COOKIE;
  const sessionCookie = request.cookies.get(cookieName)?.value;
  if (sessionCookie) return NextResponse.next();

  const url = request.nextUrl.clone();
  // Admin routes have their own sign-in page; customers go to the storefront login.
  url.pathname = isAdmin ? "/admin/login" : "/auth/login";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/account/:path*", "/admin/((?!login).*)"],
};
