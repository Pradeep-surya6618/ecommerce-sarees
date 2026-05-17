import { describe, expect, it } from "vitest";
import type { CartItem } from "@/types/domain";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise, GST_RATE } from "./totals";

const item = (unitPricePaise: number, quantity: number): CartItem => ({
  id: "ci_x",
  productId: "p",
  productSlug: "p",
  productName: "P",
  variantSku: "sku",
  variantLabel: "Colour",
  imageUrl: "https://example.com/x.jpg",
  unitPricePaise,
  unitMrpPaise: unitPricePaise,
  quantity,
  addedAt: "2026-05-17T00:00:00Z",
});

describe("cart totals", () => {
  it("computes subtotal as sum of unit price × quantity", () => {
    expect(computeSubtotalPaise([item(100000, 2), item(50000, 1)])).toBe(250000);
  });

  it("computes 5% GST rounded to nearest paise", () => {
    expect(GST_RATE).toBe(0.05);
    expect(computeTaxPaise(100000)).toBe(5000);
    expect(computeTaxPaise(123456)).toBe(6173);
  });

  it("computes total as subtotal + tax + shipping", () => {
    expect(computeTotalPaise({ subtotalPaise: 200000, taxPaise: 10000, shippingPaise: 8000 })).toBe(
      218000,
    );
  });
});
