"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { updateNameAction } from "@/server/actions/profile";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <Input id="fullName" {...register("fullName")} invalid={!!errors.fullName} />
      </FormField>
      <FormField label="Email" htmlFor="email" hint="Email cannot be changed in this phase">
        <Input id="email" value={email} disabled />
      </FormField>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
