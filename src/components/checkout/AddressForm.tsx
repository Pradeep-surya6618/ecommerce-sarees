"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Hash, Home, Mail, Map, MapPin, Phone, User } from "lucide-react";
import { z } from "zod";
import { INDIA_STATES } from "@/lib/cart/india-states";
import { clsx } from "@/lib/utils/clsx";
import { PillField, PillInput, PillListbox } from "@/components/account/AccountFields";
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

export interface AddressSubmitOptions {
  /** Persist this address to the customer's account for next time. */
  saveToAccount: boolean;
}

export interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (address: Address, opts: AddressSubmitOptions) => void;
  formId?: string;
  /** Show the "save to my account" checkbox — only for signed-in customers. */
  showSaveOption?: boolean;
}

export function AddressForm({ defaultValues, onSubmit, formId, showSaveOption }: AddressFormProps) {
  // Default to saving — most signed-in customers want their address remembered.
  const [saveToAccount, setSaveToAccount] = useState(true);
  const {
    register,
    control,
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
      onSubmit={handleSubmit((values) =>
        onSubmit(
          { ...values, country: "IN" },
          { saveToAccount: showSaveOption ? saveToAccount : false },
        ),
      )}
      className="flex flex-col gap-4 sm:gap-5"
    >
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
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
        <PillField
          label="Mobile number"
          htmlFor="phone"
          required
          hint="10 digits, no spaces."
          error={errors.phone?.message}
        >
          <PillInput
            id="phone"
            icon={Phone}
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="98765 43210"
            {...register("phone")}
            invalid={!!errors.phone}
          />
        </PillField>
      </div>

      <PillField label="Email" htmlFor="email" required error={errors.email?.message}>
        <PillInput
          id="email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
          invalid={!!errors.email}
        />
      </PillField>

      <PillField label="Address line 1" htmlFor="line1" required error={errors.line1?.message}>
        <PillInput
          id="line1"
          icon={Home}
          autoComplete="address-line1"
          placeholder="Street name and number"
          {...register("line1")}
          invalid={!!errors.line1}
        />
      </PillField>

      <PillField
        label="Apartment, suite"
        htmlFor="line2"
        hint="Optional."
        error={errors.line2?.message}
      >
        <PillInput
          id="line2"
          icon={Building2}
          autoComplete="address-line2"
          placeholder="Apt, suite, landmark"
          {...register("line2")}
        />
      </PillField>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <PillField label="City" htmlFor="city" required error={errors.city?.message}>
          <PillInput
            id="city"
            icon={MapPin}
            autoComplete="address-level2"
            placeholder="Bengaluru"
            {...register("city")}
            invalid={!!errors.city}
          />
        </PillField>
        <PillField label="Pincode" htmlFor="pincode" required error={errors.pincode?.message}>
          <PillInput
            id="pincode"
            icon={Hash}
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="560001"
            {...register("pincode")}
            invalid={!!errors.pincode}
          />
        </PillField>
      </div>

      <PillField label="State" htmlFor="state" required error={errors.state?.message}>
        <Controller
          name="state"
          control={control}
          render={({ field }) => (
            <PillListbox
              id="state"
              icon={Map}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={INDIA_STATES}
              placeholder="Select a state"
              invalid={!!errors.state}
            />
          )}
        />
      </PillField>

      {showSaveOption && (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={saveToAccount}
            onChange={(e) => setSaveToAccount(e.target.checked)}
            className={clsx(
              "h-4 w-4 shrink-0 cursor-pointer rounded border-ink-500/40 text-accent-primary",
              "focus:ring-accent-primary/40",
            )}
          />
          Save this address to my account for next time
        </label>
      )}
    </form>
  );
}
