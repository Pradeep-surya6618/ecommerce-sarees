import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriceTag } from "./PriceTag";

describe("PriceTag", () => {
  it("renders price only when no MRP", () => {
    render(<PriceTag priceInPaise={125000} />);
    expect(screen.getByText("₹1,250")).toBeInTheDocument();
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
  });

  it("renders price + strikethrough MRP when MRP exceeds price", () => {
    render(<PriceTag priceInPaise={100000} mrpInPaise={150000} />);
    expect(screen.getByText("₹1,000")).toBeInTheDocument();
    expect(screen.getByText("₹1,500")).toBeInTheDocument();
  });

  it("hides MRP strike when MRP equals price", () => {
    render(<PriceTag priceInPaise={100000} mrpInPaise={100000} />);
    expect(screen.queryByText("₹1,000")).toBeInTheDocument();
    // Only one ₹1,000 (the price) — no strike line equal to price.
    expect(screen.queryAllByText("₹1,000")).toHaveLength(1);
  });
});
