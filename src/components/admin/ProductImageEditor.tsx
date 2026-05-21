"use client";

import { ArrowDown, ArrowUp, ImagePlus, Link2, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { ProductImage } from "@/types/domain";

export interface ProductImageEditorProps {
  value: ProductImage[];
  onChange: (next: ProductImage[]) => void;
}

function emptyImage(): ProductImage {
  return { url: "", alt: "" };
}

export function ProductImageEditor({ value, onChange }: ProductImageEditorProps) {
  function update(index: number, patch: Partial<ProductImage>) {
    const next = value.map((img, i) => (i === index ? { ...img, ...patch } : img));
    onChange(next);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = value.slice();
    [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
    onChange(next);
  }

  function moveDown(index: number) {
    if (index === value.length - 1) return;
    const next = value.slice();
    [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
    onChange(next);
  }

  function addRow() {
    onChange([...value, emptyImage()]);
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 && (
        <p className="text-sm text-ink-500">No images yet. Add at least one.</p>
      )}

      {value.map((img, i) => {
        const hasImage = img.url.trim().length > 0;
        return (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-ink-500/15 bg-bg-base p-3 sm:flex-row sm:items-stretch sm:p-4"
          >
            {/* Upload / Preview */}
            <div className="flex shrink-0 flex-col items-center justify-center gap-2 sm:w-44">
              {hasImage ? (
                <>
                  <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated shadow-card">
                    {/* Plain <img> because admins can paste arbitrary URLs that aren't whitelisted in next.config.ts. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt || "Product image"}
                      className="h-full w-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute left-1.5 top-1.5 inline-flex items-center rounded-full bg-accent-primary px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white shadow">
                        Cover
                      </span>
                    )}
                  </div>
                  <ImageUploader
                    folder="products"
                    label="Replace"
                    onUploaded={(url) => update(i, { url })}
                  />
                </>
              ) : (
                <ImageUploader
                  folder="products"
                  variant="dropzone"
                  label="Drop image here"
                  hint="or click to browse · PNG, JPG, WEBP · up to 10MB"
                  onUploaded={(url) => update(i, { url })}
                />
              )}
            </div>

            {/* Details */}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
                  Alt text
                </label>
                <input
                  type="text"
                  value={img.alt}
                  onChange={(e) => update(i, { alt: e.target.value })}
                  placeholder="Descriptive alt text"
                  className="h-10 w-full rounded-lg border border-ink-500/30 bg-bg-elevated px-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-accent-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-ink-500">
                  <Link2 className="h-3 w-3" />
                  Image URL
                  {hasImage && (
                    <span className="ml-1 text-[9px] normal-case tracking-normal text-ink-500/70">
                      (auto-filled from upload — editable)
                    </span>
                  )}
                </label>
                <input
                  type="url"
                  value={img.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder="Paste a URL or upload above"
                  className="h-9 w-full rounded-lg border border-ink-500/20 bg-bg-elevated/60 px-3 font-mono text-xs text-ink-700 placeholder:text-ink-500 focus:border-accent-primary focus:bg-bg-elevated focus:text-ink-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-start gap-1 sm:flex-col">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                aria-label="Move image up"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-ink-500/20 text-ink-700 transition hover:border-ink-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === value.length - 1}
                aria-label="Move image down"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-ink-500/20 text-ink-700 transition hover:border-ink-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove image"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-danger/30 text-danger transition hover:bg-danger/5"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-dashed border-ink-500/30 px-4 py-2 text-sm text-ink-700 transition hover:border-accent-primary hover:text-accent-primary"
      >
        <ImagePlus className="h-4 w-4" />+ Add image
      </button>
    </div>
  );
}
