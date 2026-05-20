"use client";

import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Hash, Home, Mail, Map, MapPin, Phone, Tag, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { INDIA_STATES } from "@/lib/cart/india-states";
import { createAddressAction, updateAddressAction } from "@/server/actions/addresses";
import {
  FormSection,
  PillField,
  PillInput,
  PillListbox,
  PillSubmitButton,
} from "@/components/account/AccountFields";

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
    control,
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:gap-7">
      {/* â”€â”€ Contact section â”€â”€ */}
      <FormSection title="Contact" hint="So we can reach you about your order.">
        <PillField
          label="Label"
          htmlFor="label"
          hint="A nickname for this address."
          error={errors.label?.message}
        >
          <PillInput
            id="label"
            icon={Tag}
            placeholder="Home, Office, etc."
            {...register("label")}
          />
        </PillField>
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
          <PillField label="Mobile" htmlFor="phone" required error={errors.phone?.message}>
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
      </FormSection>

      {/* â”€â”€ Address section â”€â”€ */}
      <FormSection title="Where it ships" hint="Use the address on the package.">
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
      </FormSection>

      {/* â”€â”€ Submit â”€â”€ */}
      <div className="flex items-center justify-end gap-2 sm:gap-3">
        {editId && (
          <button
            type="button"
            onClick={() => {
              reset();
              onComplete?.();
            }}
            className="cursor-pointer text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500 transition hover:text-ink-900 sm:text-xs sm:tracking-[0.2em] md:text-sm"
          >
            Cancel
          </button>
        )}
        <PillSubmitButton pending={pending} pendingLabel="Saving…">
          {editId ? "Save changes" : "Add address"}
        </PillSubmitButton>
      </div>
    </form>
  );
}
