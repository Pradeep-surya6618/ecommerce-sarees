import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuantityStepper } from "./QuantityStepper";

describe("QuantityStepper", () => {
  it("increments and decrements", async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} onChange={onChange} min={1} max={5} />);
    await userEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onChange).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("disables increment at max and decrement at min", () => {
    render(<QuantityStepper value={5} onChange={() => {}} min={1} max={5} />);
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrease quantity" })).not.toBeDisabled();
  });
});
