import { PRODUCTS_FIXTURE } from "@/lib/db/fixtures/products";

export interface FabricOption {
  value: string;
  label: string;
}

export interface ColorOption {
  value: string;
  hex: string;
}

export interface PriceBucket {
  min: number;
  max: number;
  label: string;
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function getFabricOptions(): FabricOption[] {
  const fabrics = uniq(PRODUCTS_FIXTURE.map((p) => p.fabric.toLowerCase()));
  return fabrics
    .map((f) => ({ value: f, label: f.replace(/(^|\s)\S/g, (s) => s.toUpperCase()) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getColorOptions(): ColorOption[] {
  const map = new Map<string, string>();
  for (const p of PRODUCTS_FIXTURE) {
    for (const v of p.variants) {
      if (!map.has(v.colorName)) map.set(v.colorName, v.colorHex);
    }
  }
  return [...map.entries()]
    .map(([value, hex]) => ({ value, hex }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

export function getOccasionOptions(): FabricOption[] {
  const all = PRODUCTS_FIXTURE.flatMap((p) => p.occasion);
  return uniq(all)
    .map((o) => ({ value: o, label: o.replace(/(^|\s)\S/g, (s) => s.toUpperCase()) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export const PRICE_BUCKETS: PriceBucket[] = [
  { min: 0, max: 500000, label: "Under ₹5,000" },
  { min: 500000, max: 1500000, label: "₹5,000 – ₹15,000" },
  { min: 1500000, max: 3000000, label: "₹15,000 – ₹30,000" },
  { min: 3000000, max: 6000000, label: "₹30,000 – ₹60,000" },
];
