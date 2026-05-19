"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { updateInstagramAction } from "@/server/actions/admin-site-settings";
import { Input } from "@/components/ui/Input";
import type { InstagramSettings, InstagramTile } from "@/types/domain";

export interface InstagramEditorProps {
  initial: InstagramSettings;
}

export function InstagramEditor({ initial }: InstagramEditorProps) {
  const [handle, setHandle] = useState(initial.handle);
  const [ctaHref, setCtaHref] = useState(initial.ctaHref);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [tiles, setTiles] = useState<InstagramTile[]>(initial.tiles);
  const [pending, startTransition] = useTransition();

  function updateTile(id: string, patch: Partial<InstagramTile>) {
    setTiles((arr) => arr.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTile() {
    setTiles((arr) => [...arr, { id: `ig_${nanoid(8)}`, imageUrl: "", href: "", visible: true }]);
  }

  function removeTile(id: string) {
    setTiles((arr) => arr.filter((t) => t.id !== id));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateInstagramAction({ handle, ctaHref, enabled, tiles });
        toast.success("Instagram section updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save changes.");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6 rounded-md border border-ink-500/10 bg-bg-elevated p-6"
    >
      <Section title="Header">
        <Field label="Handle" htmlFor="handle" hint="Shown above the title.">
          <Input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
        </Field>
        <Field
          label="Follow URL"
          htmlFor="ctaHref"
          hint="Where the handle + 'Follow on Instagram' button link to."
        >
          <Input
            id="ctaHref"
            type="url"
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
          />
        </Field>
        <label className="inline-flex items-center gap-3 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-ink-500/30 accent-accent-primary"
          />
          Show this section on the storefront
        </label>
      </Section>

      <Section
        title={`Tiles · ${tiles.length}`}
        action={
          <button
            type="button"
            onClick={addTile}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm bg-ink-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-ink-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add tile
          </button>
        }
      >
        {tiles.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink-500/20 bg-bg-base p-6 text-center text-sm text-ink-500">
            No tiles yet. Click <em>Add tile</em> above to add one.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {tiles.map((t, idx) => (
              <li
                key={t.id}
                className="grid grid-cols-[72px_1fr_auto] gap-3 rounded-sm border border-ink-500/10 bg-bg-base p-3 sm:grid-cols-[80px_1fr_auto] sm:gap-4 sm:p-4"
              >
                {/* Preview */}
                <div className="relative h-[72px] w-[72px] overflow-hidden rounded-sm bg-ink-500/10 sm:h-20 sm:w-20">
                  {t.imageUrl && /^https?:\/\//.test(t.imageUrl) && (
                    <Image
                      src={t.imageUrl}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                    Tile {idx + 1}
                  </span>
                  <Input
                    placeholder="Image URL (https://…)"
                    value={t.imageUrl}
                    onChange={(e) => updateTile(t.id, { imageUrl: e.target.value })}
                  />
                  <Input
                    placeholder="Post link (optional, falls back to Follow URL)"
                    value={t.href}
                    onChange={(e) => updateTile(t.id, { href: e.target.value })}
                  />
                  <label className="inline-flex items-center gap-2 text-xs text-ink-700">
                    <input
                      type="checkbox"
                      checked={t.visible}
                      onChange={(e) => updateTile(t.id, { visible: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-ink-500/30 accent-accent-primary"
                    />
                    Visible
                  </label>
                </div>

                <button
                  type="button"
                  aria-label="Remove tile"
                  onClick={() => removeTile(t.id)}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center self-start rounded-sm text-ink-500 transition hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-accent-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <span className="text-xs text-ink-500">
          Tiles are shown left-to-right in the order listed.
        </span>
      </div>
    </form>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-ink-500/10 pb-6 last:border-b-0 last:pb-0">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{title}</h2>
        {action}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-900">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-ink-500">{hint}</span>}
    </div>
  );
}
