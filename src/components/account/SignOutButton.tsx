"use client";

import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { logoutAction } from "@/server/actions/auth";

export interface SignOutButtonProps {
  className?: string;
  children: ReactNode;
  pendingChildren?: ReactNode;
}

// Shared sign-out button — toasts on both success (right before the redirect
// reloads the page) and on the rare error path. Same component is reused for
// the desktop sidebar and the mobile button on /account.
export function SignOutButton({ className, children, pendingChildren }: SignOutButtonProps) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      try {
        await logoutAction();
      } catch (err) {
        // logoutAction calls `redirect()` on success, which surfaces as the
        // NEXT_REDIRECT error in client land.
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          toast.success("Signed out");
          return;
        }
        toast.error("Couldn't sign out. Please try again.");
      }
    });
  }

  return (
    <button type="button" onClick={onClick} disabled={pending} className={className}>
      {pending ? (pendingChildren ?? children) : children}
    </button>
  );
}
