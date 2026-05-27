"use client";

import { useState, useTransition } from "react";
import { Briefcase, Building2, Hash, Mail, MapPin, Phone, Receipt, Tag } from "lucide-react";
import { toast } from "sonner";
import { updateStoreProfileAction } from "@/server/actions/admin-site-settings";
import { PillField, PillInput, PillSubmitButton } from "@/components/account/AccountFields";
import type { StoreProfileSettings } from "@/types/domain";

export interface StoreProfileEditorProps {
  initial: StoreProfileSettings;
}

// Single editor for all the store identity + contact fields. Server-side
// validation handles email/GST/PAN format errors and surfaces them via the
// `description` slot on the error toast.
export function StoreProfileEditor({ initial }: StoreProfileEditorProps) {
  const [values, setValues] = useState<StoreProfileSettings>(initial);
  const [pending, startTransition] = useTransition();

  const dirty = (Object.keys(values) as (keyof StoreProfileSettings)[]).some(
    (k) => values[k] !== initial[k],
  );

  function update(key: keyof StoreProfileSettings, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await updateStoreProfileAction(values);
        if (!result.ok) {
          toast.error("Couldn't save store profile", { description: result.error });
          return;
        }
        toast.success("Store profile saved");
      } catch {
        toast.error("Couldn't save store profile", { description: "Please try again." });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:gap-4">
      <p className="text-[11px] leading-relaxed text-ink-500 sm:text-xs">
        {
          "Customer-facing contact details and legal identifiers. Email + phone + wholesale email appear on the /contact page; GST + PAN show on invoices."
        }
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <PillField label="Legal name" htmlFor="legalName">
          <PillInput
            id="legalName"
            icon={Building2}
            placeholder="Saree Store Private Limited"
            value={values.legalName}
            onChange={(e) => update("legalName", e.target.value)}
          />
        </PillField>
        <PillField label="Trade name" htmlFor="tradeName">
          <PillInput
            id="tradeName"
            icon={Tag}
            placeholder="Saree Store"
            value={values.tradeName}
            onChange={(e) => update("tradeName", e.target.value)}
          />
        </PillField>

        <PillField label="GST number" htmlFor="gstNumber">
          <PillInput
            id="gstNumber"
            icon={Hash}
            placeholder="29ABCDE1234F1Z5"
            value={values.gstNumber}
            onChange={(e) => update("gstNumber", e.target.value)}
            style={{ textTransform: "uppercase" }}
          />
        </PillField>
        <PillField label="PAN" htmlFor="pan">
          <PillInput
            id="pan"
            icon={Receipt}
            placeholder="ABCDE1234F"
            value={values.pan}
            onChange={(e) => update("pan", e.target.value)}
            style={{ textTransform: "uppercase" }}
          />
        </PillField>

        <PillField label="Contact email" htmlFor="profileEmail">
          <PillInput
            id="profileEmail"
            icon={Mail}
            type="email"
            placeholder="hello@sareestore.in"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </PillField>
        <PillField label="Phone / WhatsApp" htmlFor="profilePhone">
          <PillInput
            id="profilePhone"
            icon={Phone}
            type="tel"
            placeholder="+91 80 4567 8901"
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </PillField>

        <div className="sm:col-span-2">
          <PillField label="Address" htmlFor="profileAddress">
            <PillInput
              id="profileAddress"
              icon={MapPin}
              placeholder="27 Lavelle Road, Bengaluru 560001, KA"
              value={values.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </PillField>
        </div>

        <div className="sm:col-span-2">
          <PillField
            label="Wholesale / press email"
            htmlFor="profileWholesale"
            hint="Trade enquiries go here, kept separate from general support."
          >
            <PillInput
              id="profileWholesale"
              icon={Briefcase}
              type="email"
              placeholder="wholesale@sareestore.in"
              value={values.wholesaleEmail}
              onChange={(e) => update("wholesaleEmail", e.target.value)}
            />
          </PillField>
        </div>
      </div>

      <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center sm:gap-3">
        {!dirty && !pending && (
          <span className="text-[10px] text-ink-500 sm:text-xs">No changes</span>
        )}
        <PillSubmitButton
          pending={pending}
          pendingLabel="Saving…"
          disabled={!dirty}
          className="self-stretch sm:self-auto"
        >
          Save store profile
        </PillSubmitButton>
      </div>
    </form>
  );
}
