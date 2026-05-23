"use client";

import { useState, useTransition } from "react";
import { Eye, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import { updateAnnouncementAction } from "@/server/actions/admin-site-settings";
import { PillField, PillInput, PillSubmitButton } from "@/components/account/AccountFields";
import type { AnnouncementSettings } from "@/types/domain";

export interface AnnouncementBarEditorProps {
  initial: AnnouncementSettings;
}

const MAX_LEN = 140;

export function AnnouncementBarEditor({ initial }: AnnouncementBarEditorProps) {
  const [message, setMessage] = useState(initial.message);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [pending, startTransition] = useTransition();

  const trimmed = message.trim();
  const tooLong = message.length > MAX_LEN;
  const disabled = pending || (enabled && trimmed.length === 0) || tooLong;
  const dirty = message !== initial.message || enabled !== initial.enabled;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateAnnouncementAction({ message: trimmed, enabled });
        toast.success("Announcement bar updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save announcement.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:gap-4">
      <PillField
        label="Message"
        htmlFor="announcementMessage"
        hint="Shown across all storefront pages."
        error={tooLong ? `Trim to ${MAX_LEN} characters or fewer.` : undefined}
      >
        <PillInput
          id="announcementMessage"
          icon={Megaphone}
          value={message}
          maxLength={MAX_LEN + 20}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Free shipping on orders over ₹2,000"
          invalid={tooLong}
        />
      </PillField>
      <div className="ml-3 flex items-center justify-end text-[10px] text-ink-500 sm:text-xs">
        <span className={tooLong ? "text-danger" : undefined}>
          {message.length} / {MAX_LEN}
        </span>
      </div>

      <label
        htmlFor="announcementEnabled"
        className={clsx(
          "flex cursor-pointer items-center gap-3 rounded-2xl border bg-bg-elevated p-3 transition sm:p-4",
          enabled ? "border-accent-primary/40 bg-accent-primary/[0.04]" : "border-ink-500/15",
        )}
      >
        <input
          id="announcementEnabled"
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="sr-only"
        />
        <span
          className={clsx(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
            enabled ? "bg-accent-primary text-white" : "bg-ink-900/[0.06] text-accent-primary",
          )}
        >
          <Eye className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium text-ink-900">Show on storefront</span>
          <span className="text-[11px] text-ink-500 sm:text-xs">
            The announcement bar appears at the top of every page.
          </span>
        </span>
        <span
          role="switch"
          aria-checked={enabled}
          className={clsx(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
            enabled ? "bg-accent-primary" : "bg-ink-500/25",
          )}
        >
          <span
            className={clsx(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
              enabled ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </span>
      </label>

      <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-ink-500/25 bg-bg-base p-3 sm:p-4">
        <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
          Preview
        </span>
        {enabled && trimmed ? (
          <div className="overflow-hidden rounded-lg bg-ink-900 py-2 text-[10px] uppercase tracking-[0.2em] text-bg-base sm:py-2.5 sm:text-xs">
            {/* Mobile marquee — duplicated content for a seamless loop, matching the storefront's `announcement-marquee` animation. */}
            <div className="flex w-max items-center gap-12 pl-12 sm:hidden announcement-marquee">
              <span>{trimmed}</span>
              <span aria-hidden>·</span>
              <span aria-hidden>{trimmed}</span>
              <span aria-hidden>·</span>
              <span aria-hidden>{trimmed}</span>
              <span aria-hidden>·</span>
            </div>
            {/* Desktop — static, centered, matching how the storefront renders on wider viewports. */}
            <div className="hidden text-center sm:block">{trimmed}</div>
          </div>
        ) : (
          <span className="text-[11px] italic text-ink-500 sm:text-xs">
            Bar hidden on storefront.
          </span>
        )}
      </div>

      <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center sm:gap-3">
        {!dirty && !pending && (
          <span className="text-[10px] text-ink-500 sm:text-xs">No changes</span>
        )}
        <PillSubmitButton
          pending={pending}
          pendingLabel="Saving…"
          disabled={disabled || !dirty}
          className="self-stretch sm:self-auto"
        >
          Save announcement
        </PillSubmitButton>
      </div>
    </form>
  );
}
