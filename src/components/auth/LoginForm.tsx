"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { loginAction } from "@/server/actions/auth";
import {
  AuthDivider,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSubmitButton,
} from "@/components/auth/AuthFields";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

type Values = z.infer<typeof schema>;

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        const result = await loginAction(values);
        if (result && !result.ok) {
          toast.error(result.error);
        }
      } catch (err) {
        // `redirect()` throws NEXT_REDIRECT on success — show the toast even
        // though the navigation may eat it; per the toast-everywhere rule
        // we'd rather over-call than be silent.
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          toast.success("Signed in");
          return;
        }
        toast.error("Couldn't sign you in. Please try again.");
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
      <AuthField label="Password" htmlFor="password" required error={errors.password?.message}>
        <AuthPasswordInput
          id="password"
          icon={Lock}
          autoComplete="current-password"
          placeholder="••••••••"
          {...register("password")}
          invalid={!!errors.password}
        />
      </AuthField>

      <div className="-mt-1 flex justify-end pr-2">
        <Link
          href="/auth/forgot-password"
          className="text-[11px] uppercase tracking-[0.18em] text-bg-base/65 transition hover:text-accent-gold sm:text-xs"
        >
          Forgot password?
        </Link>
      </div>

      <AuthSubmitButton pending={pending} pendingLabel="Signing in…">
        Sign in
      </AuthSubmitButton>

      <AuthDivider label="or" />

      <GoogleSignInButton />
    </form>
  );
}
