import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProductVariant } from "@/types/domain";
import { VariantPicker } from "./VariantPicker";

const variants: ProductVariant[] = [
  { sku: "a-maroon-s", colorName: "Maroon", colorHex: "#800", size: "S", stock: 3 },
  { sku: "a-maroon-m", colorName: "Maroon", colorHex: "#800", size: "M", stock: 0 },
  { sku: "a-sage-s", colorName: "Sage", colorHex: "#9BAE92", size: "S", stock: 4 },
];

describe("VariantPicker", () => {
  it("calls onChange with the selected sku when a color is clicked", async () => {
    const onChange = vi.fn();
    render(<VariantPicker variants={variants} selectedSku={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Maroon/ }));
    expect(onChange).toHaveBeenCalled();
  });

  it("marks out-of-stock sizes as disabled", () => {
    render(<VariantPicker variants={variants} selectedSku="a-maroon-s" onChange={() => {}} />);
    const mSize = screen.getByRole("button", { name: "M" });
    expect(mSize).toBeDisabled();
  });

  it("omits the size row when no variant has a size", () => {
    const noSize: ProductVariant[] = [{ sku: "a", colorName: "Ivory", colorHex: "#fff", stock: 5 }];
    render(<VariantPicker variants={noSize} selectedSku="a" onChange={() => {}} />);
    expect(screen.queryByText(/^Size$/)).not.toBeInTheDocument();
  });
});
