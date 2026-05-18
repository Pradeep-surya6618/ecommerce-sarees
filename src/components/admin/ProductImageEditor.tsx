"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
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
      {value.map((img, i) => (
        <div
          key={i}
          className="grid items-end gap-3 rounded-sm border border-ink-500/15 bg-bg-base p-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          {/* URL */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-ink-700">
              Image URL <span className="text-danger">*</span>
            </label>
            <input
              type="url"
              value={img.url}
              onChange={(e) => update(i, { url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="h-10 w-full rounded-sm border border-ink-500/30 bg-bg-elevated px-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-accent-primary focus:outline-none"
            />
          </div>

          {/* Alt */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-ink-700">
              Alt text
            </label>
            <input
              type="text"
              value={img.alt}
              onChange={(e) => update(i, { alt: e.target.value })}
              placeholder="Descriptive alt text"
              className="h-10 w-full rounded-sm border border-ink-500/30 bg-bg-elevated px-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-accent-primary focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-end gap-1">
            <button
              type="button"
              onClick={() => moveUp(i)}
              disabled={i === 0}
              aria-label="Move image up"
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-ink-500/20 text-ink-700 transition hover:border-ink-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => moveDown(i)}
              disabled={i === value.length - 1}
              aria-label="Move image down"
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-ink-500/20 text-ink-700 transition hover:border-ink-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove image"
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-danger/30 text-danger transition hover:bg-danger/5"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="self-start rounded-sm border border-dashed border-ink-500/30 px-4 py-2 text-sm text-ink-700 transition hover:border-accent-primary hover:text-accent-primary"
      >
        + Add image
      </button>
    </div>
  );
}
