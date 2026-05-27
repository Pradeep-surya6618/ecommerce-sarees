"use client";

import { useState, useTransition } from "react";
import { IndianRupee, Truck } from "lucide-react";
import { toast } from "sonner";
import { paiseToRupees, rupeesToPaise } from "@/lib/money";
import { updateShippingAction } from "@/server/actions/admin-site-settings";
import { PillField, PillInput, PillSubmitButton } from "@/components/account/AccountFields";
import type { ShippingSettings } from "@/types/domain";

export interface ShippingEditorProps {
  initial: ShippingSettings;
}

// Admin edits rupee amounts; we store paise. Local form state is the rupee
// string so the inputs behave naturally, converted on submit.
interface FormState {
  freeShippingThresholdRupees: string;
  standardRateRupees: string;
  expressRateRupees: string;
}

function toForm(s: ShippingSettings): FormState {
  return {
    freeShippingThresholdRupees: String(paiseToRupees(s.freeShippingThresholdPaise)),
    standardRateRupees: String(paiseToRupees(s.standardRatePaise)),
    expressRateRupees: String(paiseToRupees(s.expressRatePaise)),
  };
}

export function ShippingEditor({ initial }: ShippingEditorProps) {
  const [form, setForm] = useState<FormState>(toForm(initial));
  const [pending, startTransition] = useTransition();

  const baseline = toForm(initial);
  const dirty = (Object.keys(form) as (keyof FormState)[]).some((k) => form[k] !== baseline[k]);

  function update(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const threshold = Number(form.freeShippingThresholdRupees);
    const standard = Number(form.standardRateRupees);
    const express = Number(form.expressRateRupees);
    if ([threshold, standard, express].some((n) => !Number.isFinite(n) || n < 0)) {
      toast.error("Enter valid, non-negative amounts.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await updateShippingAction({
          freeShippingThresholdPaise: rupeesToPaise(threshold),
          standardRatePaise: rupeesToPaise(standard),
          expressRatePaise: rupeesToPaise(express),
        });
        if (!result.ok) {
          toast.error("Couldn't save shipping rates", { description: result.error });
          return;
        }
        toast.success("Shipping rates saved");
      } catch {
        toast.error("Couldn't save shipping rates", { description: "Please try again." });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:gap-4">
      <p className="text-[11px] leading-relaxed text-ink-500 sm:text-xs">
        {
          "Amounts in rupees. Free shipping unlocks once the cart subtotal reaches the threshold. These apply at checkout right away."
        }
      </p>
      <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
        <PillField
          label="Free shipping over"
          htmlFor="freeShippingThreshold"
          hint="Set 0 to always offer free shipping."
        >
          <PillInput
            id="freeShippingThreshold"
            icon={Truck}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="2000"
            value={form.freeShippingThresholdRupees}
            onChange={(e) => update("freeShippingThresholdRupees", e.target.value)}
          />
        </PillField>
        <PillField label="Standard rate" htmlFor="standardRate">
          <PillInput
            id="standardRate"
            icon={IndianRupee}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="80"
            value={form.standardRateRupees}
            onChange={(e) => update("standardRateRupees", e.target.value)}
          />
        </PillField>
        <PillField label="Express rate" htmlFor="expressRate">
          <PillInput
            id="expressRate"
            icon={IndianRupee}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="200"
            value={form.expressRateRupees}
            onChange={(e) => update("expressRateRupees", e.target.value)}
          />
        </PillField>
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
          Save shipping rates
        </PillSubmitButton>
      </div>
    </form>
  );
}
