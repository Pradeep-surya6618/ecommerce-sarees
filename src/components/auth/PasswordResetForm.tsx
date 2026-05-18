"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { resetPasswordAction } from "@/server/actions/auth";
import { FormField } from "@/components/ui/FormField";
import { OtpInput } from "@/components/ui/OtpInput";
import { PasswordInput } from "@/components/ui/PasswordInput";

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <p className="text-sm text-ink-700">
        Enter the code sent to <span className="font-medium text-ink-900">{email}</span> and choose
        a new password.
      </p>
      <FormField label="Verification code" htmlFor="otp" required>
        <OtpInput value={code} onChange={setCode} />
      </FormField>
      <FormField label="New password" htmlFor="password" required error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          {...register("password")}
          invalid={!!errors.password}
        />
      </FormField>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
