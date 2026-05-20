"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { updateNameAction } from "@/server/actions/profile";
import { PillField, PillInput, PillSubmitButton } from "@/components/account/AccountFields";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
});
type Values = z.infer<typeof schema>;

export function ProfileForm({
  defaultFullName,
  email,
}: {
  defaultFullName: string;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: defaultFullName },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        await updateNameAction(values);
        toast.success("Name updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:gap-5">
      <PillField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <PillInput
          id="fullName"
          icon={User}
          autoComplete="name"
          placeholder="Your name"
          {...register("fullName")}
          invalid={!!errors.fullName}
        />
      </PillField>

      <PillField label="Email" htmlFor="email" hint="Email cannot be changed in this phase.">
        <PillInput
          id="email"
          icon={Mail}
          type="email"
          value={email}
          readOnly
          disabled
          autoComplete="email"
        />
      </PillField>

      <div className="flex justify-end">
        <PillSubmitButton pending={pending} pendingLabel="Saving…">
          Save changes
        </PillSubmitButton>
      </div>
    </form>
  );
}
