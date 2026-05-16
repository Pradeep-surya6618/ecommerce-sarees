import { describe, expect, it } from "vitest";
import { formatRupees, paiseToRupees, rupeesToPaise } from "./money";

describe("money", () => {
  it("converts paise to rupees as number", () => {
    expect(paiseToRupees(125000)).toBe(1250);
    expect(paiseToRupees(99)).toBe(0.99);
  });

  it("converts rupees to paise as integer", () => {
    expect(rupeesToPaise(1250)).toBe(125000);
    expect(rupeesToPaise(0.99)).toBe(99);
  });

  it("formats paise as Indian rupees with the ₹ symbol and grouping", () => {
    expect(formatRupees(125000)).toBe("₹1,250");
    expect(formatRupees(2500000)).toBe("₹25,000");
    expect(formatRupees(10000000)).toBe("₹1,00,000");
  });

  it("hides paise when the amount is a whole rupee", () => {
    expect(formatRupees(50000)).toBe("₹500");
  });

  it("shows two decimals when paise are non-zero", () => {
    expect(formatRupees(50050)).toBe("₹500.50");
  });
});
