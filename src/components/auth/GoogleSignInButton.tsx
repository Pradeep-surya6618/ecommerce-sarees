"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DEMO_GOOGLE_ACCOUNTS, type DemoGoogleEmail } from "@/lib/auth/google-demo-accounts";
import { clsx } from "@/lib/utils/clsx";
import { googleSignInAction } from "@/server/actions/google-auth";
import { Sheet } from "@/components/ui/Sheet";

export function GoogleSignInButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function pick(email: DemoGoogleEmail) {
    setOpen(false);
    startTransition(async () => {
      try {
        await googleSignInAction(email);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error("Google sign-in failed. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={clsx(
          "inline-flex w-full items-center justify-center gap-3 rounded-sm border border-ink-500/30 bg-bg-elevated px-4 py-3 text-sm font-medium text-ink-900 transition hover:border-ink-700",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <GoogleLogoSvg />
        Continue with Google
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title="Choose a demo Google account"
      >
        <div className="flex flex-col gap-2 pb-4">
          <p className="text-xs text-ink-500">
            Demo mode: real Google OAuth wires up in a later phase. Pick a demo account to continue.
          </p>
          {DEMO_GOOGLE_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => pick(acc.email)}
              className="flex items-center gap-3 rounded-sm border border-ink-500/15 bg-bg-base p-4 text-left transition hover:border-ink-700"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary/10 text-sm font-semibold text-accent-primary">
                {acc.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <span className="flex flex-col">
                <span className="font-medium text-ink-900">{acc.fullName}</span>
                <span className="text-xs text-ink-500">{acc.email}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
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
