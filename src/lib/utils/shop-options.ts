import type { Product } from "@/types/domain";

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

function titleCase(s: string): string {
  return s.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

// Derive filter options from the catalog the page actually has. Each shop page
// passes the active product set in; an empty catalog yields empty option lists
// (the FilterRail renders the empty state). When the catalog grows large enough
// that scanning every product becomes expensive, move this work to a denormalised
// "facets" entry on the Categories table.
export function deriveFabricOptions(products: Product[]): FabricOption[] {
  const fabrics = uniq(products.map((p) => p.fabric.toLowerCase()).filter(Boolean));
  return fabrics
    .map((f) => ({ value: f, label: titleCase(f) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function deriveColorOptions(products: Product[]): ColorOption[] {
  const map = new Map<string, string>();
  for (const p of products) {
    for (const v of p.variants) {
      if (!map.has(v.colorName)) map.set(v.colorName, v.colorHex);
    }
  }
  return [...map.entries()]
    .map(([value, hex]) => ({ value, hex }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

export function deriveOccasionOptions(products: Product[]): FabricOption[] {
  const all = products.flatMap((p) => p.occasion);
  return uniq(all)
    .map((o) => ({ value: o, label: titleCase(o) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export const PRICE_BUCKETS: PriceBucket[] = [
  { min: 0, max: 500000, label: "Under ₹5,000" },
  { min: 500000, max: 1500000, label: "₹5,000 – ₹15,000" },
  { min: 1500000, max: 3000000, label: "₹15,000 – ₹30,000" },
  { min: 3000000, max: 6000000, label: "₹30,000 – ₹60,000" },
];
