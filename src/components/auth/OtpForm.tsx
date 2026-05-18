"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resendOtpAction, verifyOtpAction } from "@/server/actions/auth";
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
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        const message = err instanceof Error ? err.message : "Verification failed.";
        toast.error(message);
      }
    });
  }

  function resend() {
    startResending(async () => {
      try {
        await resendOtpAction({ email, purpose: "signup" });
        toast.success("A new code has been generated. (Demo mode: it's still 123456.)");
      } catch {
        toast.error("Couldn't resend the code.");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-5"
    >
      <p className="text-sm text-ink-700">
        We sent a 6-digit code to <span className="font-medium text-ink-900">{email}</span>.
      </p>
      <OtpInput value={code} onChange={setCode} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Verify and continue"}
      </button>
      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="text-sm text-ink-500 underline-offset-4 transition hover:text-ink-900 hover:underline"
      >
        {resending ? "Sending a new code…" : "Resend code"}
      </button>
    </form>
  );
}
