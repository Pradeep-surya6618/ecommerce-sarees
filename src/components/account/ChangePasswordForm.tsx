"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { changePasswordAction } from "@/server/actions/profile";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";

const schema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "Use at least 8 characters"),
});
type Values = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        await changePasswordAction(values);
        toast.success("Password updated");
        reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField
        label="Current password"
        htmlFor="currentPassword"
        required
        error={errors.currentPassword?.message}
      >
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          {...register("currentPassword")}
          invalid={!!errors.currentPassword}
        />
      </FormField>
      <FormField
        label="New password"
        htmlFor="newPassword"
        required
        hint="At least 8 characters"
        error={errors.newPassword?.message}
      >
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          {...register("newPassword")}
          invalid={!!errors.newPassword}
        />
      </FormField>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
