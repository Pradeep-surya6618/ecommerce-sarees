"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { INDIA_STATES } from "@/lib/cart/india-states";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Address } from "@/types/domain";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  email: z.email("Enter a valid email"),
  line1: z.string().min(5, "Required"),
  line2: z.string().optional(),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
});

export type AddressFormValues = z.infer<typeof schema>;

export interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (address: Address) => void;
  formId?: string;
}

export function AddressForm({ defaultValues, onSubmit, formId }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...defaultValues },
  });

  useEffect(() => {
    if (defaultValues) reset({ ...defaultValues });
  }, [defaultValues, reset]);

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((values) => onSubmit({ ...values, country: "IN" }))}
      className="grid gap-5 md:grid-cols-2"
    >
      <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <Input id="fullName" {...register("fullName")} invalid={!!errors.fullName} />
      </FormField>
      <FormField
        label="Mobile number"
        htmlFor="phone"
        required
        hint="10 digits, no spaces"
        error={errors.phone?.message}
      >
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
        error={errors.state?.message}
        className="md:col-span-2"
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
    </form>
  );
}
