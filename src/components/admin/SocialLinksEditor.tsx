"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSocialLinksAction } from "@/server/actions/admin-site-settings";
import { PillField, PillInput, PillSubmitButton } from "@/components/account/AccountFields";
import {
  FacebookGlyph,
  InstagramGlyph,
  PinterestGlyph,
  WhatsAppGlyph,
  YoutubeGlyph,
} from "@/components/shared/icons";
import type { SocialLinks } from "@/types/domain";

export interface SocialLinksEditorProps {
  initial: SocialLinks;
}

interface FieldDef {
  key: keyof SocialLinks;
  label: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FIELDS: FieldDef[] = [
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/your-handle",
    icon: InstagramGlyph,
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/your-page",
    icon: FacebookGlyph,
  },
  {
    key: "pinterest",
    label: "Pinterest",
    placeholder: "https://pinterest.com/your-handle",
    icon: PinterestGlyph,
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@your-channel",
    icon: YoutubeGlyph,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    placeholder: "https://wa.me/919876543210",
    icon: WhatsAppGlyph,
  },
];

export function SocialLinksEditor({ initial }: SocialLinksEditorProps) {
  const [values, setValues] = useState<SocialLinks>(initial);
  const [pending, startTransition] = useTransition();

  const dirty = (Object.keys(values) as (keyof SocialLinks)[]).some(
    (k) => values[k] !== initial[k],
  );

  function update(key: keyof SocialLinks, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await updateSocialLinksAction(values);
        if (!result.ok) {
          toast.error("Couldn't save social links", { description: result.error });
          return;
        }
        toast.success("Social links saved");
      } catch {
        toast.error("Couldn't save social links", { description: "Please try again." });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:gap-4">
      <p className="text-[11px] leading-relaxed text-ink-500 sm:text-xs">
        Leave any field blank to hide that icon in the footer. The whole social row disappears when
        every field is empty.
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        {FIELDS.map((f) => (
          <PillField key={f.key} label={f.label} htmlFor={`social-${f.key}`}>
            <PillInput
              id={`social-${f.key}`}
              icon={f.icon}
              type="url"
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
            />
          </PillField>
        ))}
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
          Save social links
        </PillSubmitButton>
      </div>
    </form>
  );
}
