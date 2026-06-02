"use client";

import { useState, useTransition } from "react";
import { NotebookPen, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { addOrderNoteAction } from "@/server/actions/admin-orders";
import type { AdminOrderNote } from "@/types/domain";

function formatNoteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function InternalNotes({ orderId, notes }: { orderId: string; notes: AdminOrderNote[] }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    const trimmed = body.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        const result = await addOrderNoteAction(orderId, trimmed);
        if (!result.ok) {
          toast.error("Couldn't add note", { description: result.error });
          return;
        }
        setBody("");
        toast.success("Note added");
      } catch {
        toast.error("Couldn't add note", { description: "Please try again." });
      }
    });
  }

  const disabled = pending || body.trim().length === 0;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
      />
      <header className="mb-3 flex items-center gap-2.5 sm:mb-4 sm:gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
          <NotebookPen className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
            Team
          </span>
          <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
            Internal notes
          </h2>
        </div>
        {notes.length > 0 && (
          <span className="ml-auto inline-flex items-center rounded-full bg-ink-500/8 px-2 py-0.5 text-[10px] font-medium text-ink-700 sm:text-xs">
            {notes.length}
          </span>
        )}
      </header>

      {notes.length === 0 ? (
        <p className="text-xs leading-relaxed text-ink-500 sm:text-sm">
          No notes yet — add one to keep the team in sync.
        </p>
      ) : (
        <ul className="mb-4 flex flex-col gap-2.5 sm:gap-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-ink-500/10 bg-bg-base/60 p-3 sm:p-3.5"
            >
              <p className="text-xs leading-relaxed text-ink-900 sm:text-sm">{n.body}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-ink-500 sm:text-[11px]">
                <User className="h-3 w-3" />
                <span className="font-medium text-ink-700">{n.authorName}</span>
                <span className="text-ink-500/50">·</span>
                <span>{formatNoteTime(n.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex flex-col gap-2.5"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Add a note for the team…"
          className="w-full rounded-xl border border-ink-500/15 bg-bg-base/60 p-3 text-xs text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary focus:bg-bg-base sm:text-sm"
        />
        <button
          type="submit"
          disabled={disabled}
          className="group inline-flex h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-full bg-ink-900 px-4 text-xs font-semibold text-white shadow-[0_8px_22px_-14px_rgba(37,31,62,0.6)] transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-5 sm:text-sm"
        >
          <Plus className="h-3.5 w-3.5 transition group-hover:rotate-90 sm:h-4 sm:w-4" />
          {pending ? "Saving…" : "Add note"}
        </button>
      </form>
    </article>
  );
}
