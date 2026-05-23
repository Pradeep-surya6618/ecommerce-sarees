"use client";

import { useState, useTransition } from "react";
import { AtSign, Eye, ImageIcon, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import { updateInstagramAction } from "@/server/actions/admin-site-settings";
import {
  FormSection,
  PillField,
  PillInput,
  PillSubmitButton,
} from "@/components/account/AccountFields";
import { ImageUploader } from "@/components/admin/ImageUploader";
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

  const visibleTiles = tiles.filter((t) => t.visible && /^https?:\/\//.test(t.imageUrl)).length;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 sm:gap-7">
      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Header" hint="Handle, follow link, and section visibility.">
          <PillField label="Handle" htmlFor="handle" hint="Shown above the title.">
            <PillInput
              id="handle"
              icon={AtSign}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@saree.store"
            />
          </PillField>
          <PillField
            label="Follow URL"
            htmlFor="ctaHref"
            hint="Where the handle + 'Follow on Instagram' button link to."
          >
            <PillInput
              id="ctaHref"
              icon={LinkIcon}
              type="url"
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              placeholder="https://instagram.com/saree.store"
            />
          </PillField>

          <label
            htmlFor="enabled"
            className={clsx(
              "flex cursor-pointer items-center gap-3 rounded-2xl border bg-bg-elevated p-3 transition sm:p-4",
              enabled ? "border-accent-primary/40 bg-accent-primary/[0.04]" : "border-ink-500/15",
            )}
          >
            <input
              id="enabled"
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
                The &ldquo;From the gram&rdquo; section appears on the home page.
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
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[11px]">
                Tiles
              </h3>
              <p className="text-[11px] text-ink-500 sm:text-xs">
                {tiles.length} {tiles.length === 1 ? "tile" : "tiles"} · {visibleTiles} visible on
                storefront. Tiles render left-to-right in the order listed.
              </p>
            </div>
            <button
              type="button"
              onClick={addTile}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-accent-primary px-3 text-xs font-medium text-white shadow-[0_8px_24px_-12px_rgba(91,58,138,0.7)] transition hover:bg-accent-primary-hover sm:h-10 sm:px-4 sm:text-sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Add</span>
              <span className="hidden sm:inline">tile</span>
            </button>
          </div>

          {tiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-500/30 bg-bg-base p-6 text-center sm:p-8">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-500/10 text-ink-500">
                <ImageIcon className="h-5 w-5" />
              </div>
              <p className="text-[11px] text-ink-500 sm:text-sm">
                No tiles yet. Tap <strong>Add tile</strong> to insert one.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5 sm:gap-3">
              {tiles.map((t, idx) => {
                const hasImage = t.imageUrl.trim().length > 0 && /^https?:\/\//.test(t.imageUrl);
                return (
                  <li
                    key={t.id}
                    className="flex flex-col gap-2.5 rounded-2xl border border-ink-500/15 bg-bg-base p-2.5 sm:flex-row sm:items-stretch sm:gap-3 sm:p-3"
                  >
                    <div className="flex shrink-0 flex-col items-center gap-2 sm:w-[140px]">
                      {hasImage ? (
                        <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-ink-500/10 bg-bg-elevated shadow-card sm:h-28 sm:w-28">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={t.imageUrl}
                            alt={`Tile ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <ImageUploader
                          folder="banners"
                          variant="dropzone"
                          label="Drop image"
                          hint="or click to browse"
                          onUploaded={(url) => updateTile(t.id, { imageUrl: url })}
                        />
                      )}
                      {hasImage && (
                        <ImageUploader
                          folder="banners"
                          label="Replace"
                          className="self-stretch sm:self-auto"
                          onUploaded={(url) => updateTile(t.id, { imageUrl: url })}
                        />
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500 sm:text-[11px]">
                          Tile {idx + 1}
                        </span>
                        <button
                          type="button"
                          aria-label="Remove tile"
                          onClick={() => removeTile(t.id)}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-danger/30 text-danger transition hover:bg-danger/5 sm:h-8 sm:w-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <PillInput
                        icon={ImageIcon}
                        type="url"
                        placeholder="Image URL (or upload above)"
                        value={t.imageUrl}
                        onChange={(e) => updateTile(t.id, { imageUrl: e.target.value })}
                      />
                      <PillInput
                        icon={LinkIcon}
                        type="url"
                        placeholder="Post link (optional, falls back to Follow URL)"
                        value={t.href}
                        onChange={(e) => updateTile(t.id, { href: e.target.value })}
                      />
                      <label
                        className={clsx(
                          "inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wider transition sm:py-1.5 sm:text-[11px]",
                          t.visible
                            ? "border-accent-primary/40 bg-accent-primary/[0.06] text-accent-primary"
                            : "border-ink-500/15 bg-bg-elevated text-ink-500",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={t.visible}
                          onChange={(e) => updateTile(t.id, { visible: e.target.checked })}
                          className="h-3 w-3 cursor-pointer accent-accent-primary"
                        />
                        {t.visible ? "Visible" : "Hidden"}
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center">
        <span className="text-[10px] text-ink-500 sm:text-xs">
          Tiles render left-to-right in the order listed.
        </span>
        <PillSubmitButton
          pending={pending}
          pendingLabel="Saving…"
          className="self-stretch sm:self-auto"
        >
          Save changes
        </PillSubmitButton>
      </div>
    </form>
  );
}
