import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OtpInput } from "./OtpInput";

describe("OtpInput", () => {
  it("renders 6 single-digit inputs", () => {
    render(<OtpInput value="" onChange={() => {}} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("forwards typed digits to onChange", async () => {
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0]!, "1");
    expect(onChange).toHaveBeenLastCalledWith("1");
  });
});
