"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { requestPasswordResetAction } from "@/server/actions/auth";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

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
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send reset code"}
      </button>
    </form>
  );
}
