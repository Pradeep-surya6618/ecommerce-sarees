"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

// Maps the `?error=...` codes set by /api/auth/google/callback into the
// human-readable toast we show on the login screen. Anything we don't
// recognise still surfaces a generic failure — better to over-alert than
// silently swallow.
const MESSAGES: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled.",
  google_state_mismatch: "Google sign-in failed a security check. Please try again.",
  google_failed: "Couldn't complete Google sign-in. Please try again.",
  google_no_email: "Google didn't share an email address with us. Please use email + password.",
  rate_limit: "Too many sign-in attempts. Please wait a few minutes and try again.",
  blocked: "Your account has been blocked. Please contact support.",
};

export function OAuthErrorToast() {
  const params = useSearchParams();
  const error = params.get("error");
  // useRef stops React's double-invocation of effects in dev from firing the
  // toast twice — the screen only ever shows one error per visit.
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (!error || shown.current === error) return;
    shown.current = error;
    toast.error(MESSAGES[error] ?? "Sign-in failed. Please try again.");
  }, [error]);

  return null;
}
