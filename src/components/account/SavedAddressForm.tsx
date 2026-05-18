"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { INDIA_STATES } from "@/lib/cart/india-states";
import { createAddressAction, updateAddressAction } from "@/server/actions/addresses";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile"),
  email: z.email("Enter a valid email"),
  line1: z.string().min(5, "Required"),
  line2: z.string().optional(),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
  label: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export interface SavedAddressFormProps {
  editId?: string;
  defaultValues?: Partial<Values>;
  onComplete?: () => void;
}

export function SavedAddressForm({ editId, defaultValues, onComplete }: SavedAddressFormProps) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        if (editId) {
          await updateAddressAction(editId, values);
          toast.success("Address updated");
        } else {
          await createAddressAction({ ...values, country: "IN" });
          toast.success("Address added");
        }
        reset();
        onComplete?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save the address.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
      <FormField
        label="Label (optional)"
        htmlFor="label"
        className="md:col-span-2"
        error={errors.label?.message}
      >
        <Input id="label" placeholder="Home, Office, etc." {...register("label")} />
      </FormField>
      <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <Input id="fullName" {...register("fullName")} invalid={!!errors.fullName} />
      </FormField>
      <FormField label="Mobile" htmlFor="phone" required error={errors.phone?.message}>
        <Input
          id="phone"
          inputMode="numeric"
          maxLength={10}
          {...register("phone")}
          invalid={!!errors.phone}
        />
      </FormField>
      <FormField
        label="Email"
        htmlFor="email"
        required
        className="md:col-span-2"
        error={errors.email?.message}
      >
        <Input id="email" type="email" {...register("email")} invalid={!!errors.email} />
      </FormField>
      <FormField
        label="Address line 1"
        htmlFor="line1"
        required
        className="md:col-span-2"
        error={errors.line1?.message}
      >
        <Input id="line1" {...register("line1")} invalid={!!errors.line1} />
      </FormField>
      <FormField
        label="Apartment, suite (optional)"
        htmlFor="line2"
        className="md:col-span-2"
        error={errors.line2?.message}
      >
        <Input id="line2" {...register("line2")} />
      </FormField>
      <FormField label="City" htmlFor="city" required error={errors.city?.message}>
        <Input id="city" {...register("city")} invalid={!!errors.city} />
      </FormField>
      <FormField label="Pincode" htmlFor="pincode" required error={errors.pincode?.message}>
        <Input
          id="pincode"
          inputMode="numeric"
          maxLength={6}
          {...register("pincode")}
          invalid={!!errors.pincode}
        />
      </FormField>
      <FormField
        label="State"
        htmlFor="state"
        required
        className="md:col-span-2"
        error={errors.state?.message}
      >
        <Select id="state" {...register("state")}>
          <option value="">Select a state</option>
          {INDIA_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : editId ? "Save changes" : "Add address"}
        </button>
      </div>
    </form>
  );
}
