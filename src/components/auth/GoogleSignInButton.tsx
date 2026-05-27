"use client";

import { useState } from "react";
import { clsx } from "@/lib/utils/clsx";

// Anchor (not button) — clicking starts a full-page navigation to our OAuth
// start endpoint, which redirects to Google. Using `<a>` means the browser
// handles the navigation natively; no JS needed for the flow itself.
export function GoogleSignInButton({ className }: { className?: string }) {
  const [pending, setPending] = useState(false);

  return (
    <a
      href="/api/auth/google/start"
      onClick={() => setPending(true)}
      aria-disabled={pending}
      className={clsx(
        "inline-flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-bg-base/20 bg-bg-base/[0.06] px-4 text-xs font-medium uppercase tracking-[0.18em] text-bg-base transition hover:border-accent-gold hover:bg-bg-base/[0.12] sm:h-12 sm:text-sm sm:tracking-[0.15em]",
        pending && "pointer-events-none opacity-60",
        className,
      )}
    >
      <GoogleLogoSvg />
      {pending ? "Redirecting…" : "Continue with Google"}
    </a>
  );
}

// Official Google "G" logo — four-colour mark used in the Sign-in branding
// guidelines. Each path is one wedge of the G; ordering matches Google's
// public asset so the colours land in the right quadrants.
function GoogleLogoSvg() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
