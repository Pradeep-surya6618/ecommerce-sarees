"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { changePasswordAction } from "@/server/actions/profile";
import { PillField, PillPasswordInput, PillSubmitButton } from "@/components/account/AccountFields";

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:gap-5">
      <PillField
        label="Current password"
        htmlFor="currentPassword"
        required
        error={errors.currentPassword?.message}
      >
        <PillPasswordInput
          id="currentPassword"
          icon={KeyRound}
          autoComplete="current-password"
          placeholder="••••••••"
          {...register("currentPassword")}
          invalid={!!errors.currentPassword}
        />
      </PillField>
      <PillField
        label="New password"
        htmlFor="newPassword"
        required
        hint="At least 8 characters."
        error={errors.newPassword?.message}
      >
        <PillPasswordInput
          id="newPassword"
          icon={Lock}
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("newPassword")}
          invalid={!!errors.newPassword}
        />
      </PillField>

      <div className="flex justify-end">
        <PillSubmitButton pending={pending} pendingLabel="Updating…">
          Change password
        </PillSubmitButton>
      </div>
    </form>
  );
}
