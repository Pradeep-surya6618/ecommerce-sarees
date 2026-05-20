"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { signupAction } from "@/server/actions/auth";
import {
  AuthDivider,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSubmitButton,
} from "@/components/auth/AuthFields";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

type Values = z.infer<typeof schema>;

export function SignupForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        await signupAction(values);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        const message =
          err instanceof Error ? err.message : "Couldn't create your account. Please try again.";
        toast.error(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:gap-5">
      <AuthField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <AuthInput
          id="fullName"
          icon={User}
          autoComplete="name"
          placeholder="Your name"
          {...register("fullName")}
          invalid={!!errors.fullName}
        />
      </AuthField>
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
      <AuthField
        label="Password"
        htmlFor="password"
        required
        hint="At least 8 characters"
        error={errors.password?.message}
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

      <AuthSubmitButton pending={pending} pendingLabel="Creating account…">
        Create account
      </AuthSubmitButton>

      <AuthDivider label="or" />

      <GoogleSignInButton />
    </form>
  );
}
