import type { CartItem } from "@/types/domain";

export const GST_RATE = 0.05;

export function computeSubtotalPaise(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPricePaise * i.quantity, 0);
}

export function computeTaxPaise(subtotalPaise: number): number {
  return Math.round(subtotalPaise * GST_RATE);
}

export function computeTotalPaise(parts: {
  subtotalPaise: number;
  taxPaise: number;
  shippingPaise: number;
}): number {
  return parts.subtotalPaise + parts.taxPaise + parts.shippingPaise;
}
