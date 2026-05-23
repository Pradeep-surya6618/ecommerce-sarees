"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { ProductVariant } from "@/types/domain";

export interface ProductVariantEditorProps {
  value: ProductVariant[];
  onChange: (next: ProductVariant[]) => void;
}

function emptyVariant(): ProductVariant {
  return { sku: "", colorName: "", colorHex: "#000000", size: "", stock: 0 };
}

// Lets the user type a hex code OR use the colour picker.
// Accepts 3-digit shorthand (#fff) and expands it. Only commits when the
// draft parses as a valid #RRGGBB; otherwise reverts on blur so the parent
// state never holds garbage.
function HexInput({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [parentValue, setParentValue] = useState(value);

  // Re-sync the draft when the parent value changes (e.g. user clicked the picker).
  if (value !== parentValue) {
    setParentValue(value);
    setDraft(value);
  }

  function tryCommit(text: string): boolean {
    let next = text.trim();
    if (!next.startsWith("#")) next = `#${next}`;
    if (/^#[0-9a-fA-F]{3}$/.test(next)) {
      next = `#${next[1]!.repeat(2)}${next[2]!.repeat(2)}${next[3]!.repeat(2)}`;
    }
    if (/^#[0-9a-fA-F]{6}$/.test(next)) {
      onChange(next.toLowerCase());
      return true;
    }
    return false;
  }

  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        tryCommit(e.target.value);
      }}
      onBlur={() => {
        if (!tryCommit(draft)) setDraft(value);
      }}
      onFocus={(e) => e.currentTarget.select()}
      placeholder="#000000"
      maxLength={7}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      aria-label="Hex colour code"
      className="h-10 w-24 rounded-sm border border-ink-500/30 bg-bg-elevated px-2 font-mono text-xs uppercase text-ink-900 placeholder:text-ink-500 focus:border-accent-primary focus:outline-none"
    />
  );
}

export function ProductVariantEditor({ value, onChange }: ProductVariantEditorProps) {
  function update(index: number, patch: Partial<ProductVariant>) {
    const next = value.map((v, i) => (i === index ? { ...v, ...patch } : v));
    onChange(next);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...value, emptyVariant()]);
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 && (
        <p className="text-sm text-ink-500">No variants yet. Add at least one.</p>
      )}
      {value.map((v, i) => (
        <div
          key={i}
          className="grid items-end gap-3 rounded-sm border border-ink-500/15 bg-bg-base p-3 sm:grid-cols-[1fr_1fr_auto_1fr_6rem_auto]"
        >
          {/* SKU */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-ink-700">
              SKU <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={v.sku}
              onChange={(e) => update(i, { sku: e.target.value })}
              placeholder="SKU-001"
              className="h-10 w-full rounded-sm border border-ink-500/30 bg-bg-elevated px-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-accent-primary focus:outline-none"
            />
          </div>

          {/* Colour name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-ink-700">
              Colour name
            </label>
            <input
              type="text"
              value={v.colorName}
              onChange={(e) => update(i, { colorName: e.target.value })}
              placeholder="Red"
              className="h-10 w-full rounded-sm border border-ink-500/30 bg-bg-elevated px-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-accent-primary focus:outline-none"
            />
          </div>

          {/* Colour hex — picker + typeable text */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-ink-700">Hex</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={v.colorHex}
                onChange={(e) => update(i, { colorHex: e.target.value })}
                aria-label="Pick colour"
                className="h-10 w-10 cursor-pointer rounded-sm border border-ink-500/30 bg-bg-elevated p-0.5"
              />
              <HexInput value={v.colorHex} onChange={(next) => update(i, { colorHex: next })} />
            </div>
          </div>

          {/* Size (optional) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-ink-700">
              Size (optional)
            </label>
            <input
              type="text"
              value={v.size ?? ""}
              onChange={(e) => update(i, { size: e.target.value })}
              placeholder="Free size"
              className="h-10 w-full rounded-sm border border-ink-500/30 bg-bg-elevated px-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-accent-primary focus:outline-none"
            />
          </div>

          {/* Stock */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-ink-700">
              Stock
            </label>
            <input
              type="number"
              min={0}
              value={v.stock === 0 ? "" : v.stock}
              placeholder="0"
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  update(i, { stock: 0 });
                  return;
                }
                const n = Number(raw);
                update(i, { stock: Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0 });
              }}
              className="h-10 w-full rounded-sm border border-ink-500/30 bg-bg-elevated px-3 text-sm text-ink-900 focus:border-accent-primary focus:outline-none"
            />
          </div>

          {/* Remove */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove variant"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm border border-danger/30 text-danger transition hover:bg-danger/5"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="self-start cursor-pointer rounded-sm border border-dashed border-ink-500/30 px-4 py-2 text-sm text-ink-700 transition hover:border-accent-primary hover:text-accent-primary"
      >
        + Add variant
      </button>
    </div>
  );
}
