"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { signupAction } from "@/server/actions/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="name"
          {...register("fullName")}
          invalid={!!errors.fullName}
        />
      </FormField>
      <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          invalid={!!errors.email}
        />
      </FormField>
      <FormField
        label="Password"
        htmlFor="password"
        required
        hint="At least 8 characters"
        error={errors.password?.message}
      >
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
        className="mt-2 rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
      <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wide text-ink-500">
        <span className="h-px flex-1 bg-ink-500/15" />
        Or
        <span className="h-px flex-1 bg-ink-500/15" />
      </div>
      <GoogleSignInButton />
    </form>
  );
}
