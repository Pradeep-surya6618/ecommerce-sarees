"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { requestPasswordResetAction } from "@/server/actions/auth";
import { AuthField, AuthInput, AuthSubmitButton } from "@/components/auth/AuthFields";

const schema = z.object({ email: z.email("Enter a valid email") });
type Values = z.infer<typeof schema>;

export function PasswordResetRequestForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        await requestPasswordResetAction(values);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error("Couldn't send the reset code.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:gap-5">
      <AuthField label="Email" htmlFor="email" required error={errors.email?.message}>
        <AuthInput
          id="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
          invalid={!!errors.email}
        />
      </AuthField>
      <AuthSubmitButton pending={pending} pendingLabel="Sending…">
        Send reset code
      </AuthSubmitButton>
    </form>
  );
}
