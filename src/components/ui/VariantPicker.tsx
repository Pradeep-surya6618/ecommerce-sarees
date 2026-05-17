"use client";

import { clsx } from "@/lib/utils/clsx";
import type { ProductVariant } from "@/types/domain";

export interface VariantPickerProps {
  variants: ProductVariant[];
  selectedSku: string | null;
  onChange: (sku: string) => void;
  className?: string;
}

function uniqueColors(variants: ProductVariant[]) {
  const seen = new Map<string, { name: string; hex: string }>();
  for (const v of variants) {
    if (!seen.has(v.colorName)) seen.set(v.colorName, { name: v.colorName, hex: v.colorHex });
  }
  return [...seen.values()];
}

function uniqueSizesForColor(variants: ProductVariant[], colorName: string) {
  return variants
    .filter((v) => v.colorName === colorName)
    .map((v) => ({ size: v.size, sku: v.sku, stock: v.stock }))
    .filter((v): v is { size: string; sku: string; stock: number } => typeof v.size === "string");
}

export function VariantPicker({ variants, selectedSku, onChange, className }: VariantPickerProps) {
  const selected = variants.find((v) => v.sku === selectedSku) ?? null;
  const colors = uniqueColors(variants);
  const selectedColor = selected?.colorName ?? colors[0]?.name ?? "";
  const sizesForColor = uniqueSizesForColor(variants, selectedColor);
  const hasSizes = sizesForColor.length > 0;

  function pickColor(colorName: string) {
    const first = variants.find((v) => v.colorName === colorName);
    if (first) onChange(first.sku);
  }

  return (
    <div className={clsx("flex flex-col gap-5", className)}>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-700">
          Colour: <span className="text-ink-900">{selectedColor}</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => {
            const active = c.name === selectedColor;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => pickColor(c.name)}
                aria-label={c.name}
                aria-pressed={active}
                className={clsx(
                  "relative h-9 w-9 rounded-full border-2 transition",
                  active ? "border-ink-900" : "border-ink-500/20 hover:border-ink-700",
                )}
                style={{ background: c.hex }}
              />
            );
          })}
        </div>
      </div>

      {hasSizes && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-700">Size</span>
          <div className="flex flex-wrap gap-2">
            {sizesForColor.map((s) => {
              const oos = s.stock <= 0;
              const active = s.sku === selectedSku;
              return (
                <button
                  key={s.sku}
                  type="button"
                  disabled={oos}
                  aria-pressed={active}
                  onClick={() => onChange(s.sku)}
                  className={clsx(
                    "min-w-12 rounded-sm border px-3 py-2 text-sm transition",
                    active
                      ? "border-ink-900 bg-ink-900 text-white"
                      : "border-ink-500/30 text-ink-700 hover:border-ink-700",
                    oos && "cursor-not-allowed opacity-50 line-through",
                  )}
                >
                  {s.size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
