"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateAnnouncementAction } from "@/server/actions/admin-site-settings";
import { Input } from "@/components/ui/Input";
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
  const disabled = pending || (enabled && trimmed.length === 0) || message.length > MAX_LEN;
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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="announcementMessage"
          className="text-xs font-semibold uppercase tracking-wide text-ink-700"
        >
          Message
        </label>
        <Input
          id="announcementMessage"
          value={message}
          maxLength={MAX_LEN}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Free shipping on orders over ₹2,000"
        />
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>Shown across all storefront pages.</span>
          <span className={message.length > MAX_LEN ? "text-danger" : undefined}>
            {message.length}/{MAX_LEN}
          </span>
        </div>
      </div>

      <label className="inline-flex items-center gap-3 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-ink-500/30 accent-accent-primary"
        />
        Show announcement bar on storefront
      </label>

      <div className="flex flex-col gap-3 rounded-sm border border-dashed border-ink-500/20 bg-bg-base p-4">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
          Preview
        </span>
        {enabled && trimmed ? (
          <div className="bg-ink-900 py-2 text-center text-xs uppercase tracking-[0.2em] text-bg-base">
            {trimmed}
          </div>
        ) : (
          <span className="text-xs italic text-ink-500">Bar hidden on storefront.</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled || !dirty}
          className="inline-flex items-center gap-2 rounded-sm bg-accent-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save announcement"}
        </button>
        {!dirty && <span className="text-xs text-ink-500">No changes</span>}
      </div>
    </form>
  );
}
