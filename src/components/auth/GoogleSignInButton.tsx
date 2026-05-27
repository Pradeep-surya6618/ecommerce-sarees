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

function GoogleLogoSvg() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.5-1.6 4.4-5.5 4.4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.7 14.6 2.7 12 2.7 6.9 2.7 2.8 6.9 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}
