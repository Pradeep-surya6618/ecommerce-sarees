"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { resetPasswordAction } from "@/server/actions/auth";
import { AuthField, AuthPasswordInput, AuthSubmitButton } from "@/components/auth/AuthFields";
import { OtpInput } from "@/components/ui/OtpInput";

const schema = z.object({
  password: z.string().min(8, "Use at least 8 characters"),
});
type Values = z.infer<typeof schema>;

export function PasswordResetForm({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    startTransition(async () => {
      try {
        await resetPasswordAction({ email, code, password: values.password });
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Reset failed.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:gap-5">
      <p className="text-center text-xs text-bg-base/70 sm:text-sm">
        Enter the code sent to <span className="font-medium text-bg-base">{email}</span> and choose
        a new password.
      </p>
      <AuthField label="Verification code" htmlFor="otp" required>
        <div className="flex items-center gap-2 rounded-full border border-bg-base/15 bg-bg-base/[0.08] py-2 pl-1 pr-3 sm:gap-3 sm:pr-4">
          <span className="pointer-events-none inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-base text-accent-primary sm:h-10 sm:w-10">
            <KeyRound className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </span>
          <OtpInput value={code} onChange={setCode} variant="dark" />
        </div>
      </AuthField>
      <AuthField
        label="New password"
        htmlFor="password"
        required
        error={errors.password?.message}
        hint="At least 8 characters"
      >
        <AuthPasswordInput
          id="password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("password")}
          invalid={!!errors.password}
        />
      </AuthField>
      <AuthSubmitButton pending={pending} pendingLabel="Updating…">
        Update password
      </AuthSubmitButton>
    </form>
  );
}
