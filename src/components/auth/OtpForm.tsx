"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resendOtpAction, verifyOtpAction } from "@/server/actions/auth";
import { AuthSubmitButton } from "@/components/auth/AuthFields";
import { OtpInput } from "@/components/ui/OtpInput";

export interface OtpFormProps {
  email: string;
}

export function OtpForm({ email }: OtpFormProps) {
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();
  const [resending, startResending] = useTransition();

  function submit() {
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    startTransition(async () => {
      try {
        await verifyOtpAction({ email, code });
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          toast.success("Email verified. Welcome!");
          return;
        }
        const message = err instanceof Error ? err.message : "Verification failed.";
        toast.error(message);
      }
    });
  }

  function resend() {
    startResending(async () => {
      try {
        await resendOtpAction({ email, purpose: "signup" });
        toast.success("A new code has been sent to your email.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't resend the code.");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-5 sm:gap-6"
    >
      <p className="text-center text-xs text-bg-base/70 sm:text-sm">
        We sent a 6-digit code to <span className="font-medium text-bg-base">{email}</span>.
      </p>

      <OtpInput value={code} onChange={setCode} variant="dark" />

      <AuthSubmitButton pending={pending} pendingLabel="Verifying…">
        Verify and continue
      </AuthSubmitButton>

      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="cursor-pointer text-center text-[11px] uppercase tracking-[0.2em] text-bg-base/65 transition hover:text-accent-gold disabled:opacity-50 sm:text-xs"
      >
        {resending ? "Sending a new code…" : "Resend code"}
      </button>
    </form>
  );
}
