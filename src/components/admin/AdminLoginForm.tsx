"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { adminLoginAction } from "@/server/actions/admin-auth";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

type Values = z.infer<typeof schema>;

export function AdminLoginForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        await adminLoginAction(values);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        const message =
          err instanceof Error ? err.message : "Couldn't sign you in. Please try again.";
        toast.error(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          invalid={!!errors.email}
        />
      </FormField>
      <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          {...register("password")}
          invalid={!!errors.password}
        />
      </FormField>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
