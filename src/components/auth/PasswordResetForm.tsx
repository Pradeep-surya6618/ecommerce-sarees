"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
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
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          toast.success("Password updated. You're signed in.");
          return;
        }
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
        <OtpInput value={code} onChange={setCode} variant="dark" />
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
