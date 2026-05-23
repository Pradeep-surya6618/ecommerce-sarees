"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addOrderNoteAction } from "@/server/actions/admin-orders";
import type { AdminOrderNote } from "@/types/domain";

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

  return (
    <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-5">
      <h3 className="mb-3 font-display text-lg text-ink-900">Internal notes</h3>
      {notes.length === 0 ? (
        <p className="text-xs text-ink-500">No notes yet.</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-sm border border-ink-500/10 bg-bg-base p-3">
              <p className="text-sm text-ink-700">{n.body}</p>
              <p className="mt-2 text-xs text-ink-500">
                {n.authorName} &middot; {new Date(n.createdAt).toLocaleString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex flex-col gap-2"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Add a note for the team…"
          className="w-full rounded-sm border border-ink-500/20 bg-bg-base p-3 text-sm focus:border-accent-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || body.trim().length === 0}
          className="self-start rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add note"}
        </button>
      </form>
    </div>
  );
}
