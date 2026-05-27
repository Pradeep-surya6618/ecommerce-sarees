"use client";

import { useState, useTransition } from "react";
import { Building2, Clock, Link2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { updateVisitAction } from "@/server/actions/admin-site-settings";
import { PillField, PillInput, PillSubmitButton } from "@/components/account/AccountFields";
import type { VisitSettings } from "@/types/domain";

export interface VisitEditorProps {
  initial: VisitSettings;
}

export function VisitEditor({ initial }: VisitEditorProps) {
  const [values, setValues] = useState<VisitSettings>(initial);
  const [pending, startTransition] = useTransition();

  const dirty = (Object.keys(values) as (keyof VisitSettings)[]).some(
    (k) => values[k] !== initial[k],
  );

  function update(key: keyof VisitSettings, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await updateVisitAction(values);
        if (!result.ok) {
          toast.error("Couldn't save visit info", { description: result.error });
          return;
        }
        toast.success("Visit info saved");
      } catch {
        toast.error("Couldn't save visit info", { description: "Please try again." });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:gap-4">
      <p className="text-[11px] leading-relaxed text-ink-500 sm:text-xs">
        Leave fields blank to hide them in the footer “Visit” column. The whole column disappears
        when all four are empty.
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <PillField label="Address line 1" htmlFor="visitAddress1">
          <PillInput
            id="visitAddress1"
            icon={Building2}
            placeholder="27 Lavelle Road"
            value={values.addressLine1}
            onChange={(e) => update("addressLine1", e.target.value)}
          />
        </PillField>
        <PillField label="Address line 2" htmlFor="visitAddress2">
          <PillInput
            id="visitAddress2"
            icon={MapPin}
            placeholder="Bengaluru 560001"
            value={values.addressLine2}
            onChange={(e) => update("addressLine2", e.target.value)}
          />
        </PillField>
        <PillField label="Hours" htmlFor="visitHours">
          <PillInput
            id="visitHours"
            icon={Clock}
            placeholder="Mon – Sat · 11am – 8pm"
            value={values.hours}
            onChange={(e) => update("hours", e.target.value)}
          />
        </PillField>
        <PillField
          label="Link target"
          htmlFor="visitHref"
          hint="Where clicking any line goes. e.g. /contact or a maps URL."
        >
          <PillInput
            id="visitHref"
            icon={Link2}
            placeholder="/contact"
            value={values.href}
            onChange={(e) => update("href", e.target.value)}
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
          Save visit info
        </PillSubmitButton>
      </div>
    </form>
  );
}
