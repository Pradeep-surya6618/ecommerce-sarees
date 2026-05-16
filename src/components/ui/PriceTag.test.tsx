import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriceTag } from "./PriceTag";

describe("PriceTag", () => {
  it("renders price only when no MRP", () => {
    render(<PriceTag priceInPaise={125000} />);
    expect(screen.getByText("₹1,250")).toBeInTheDocument();
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
  });

  it("renders price + MRP strike + discount % when MRP exceeds price", () => {
    render(<PriceTag priceInPaise={100000} mrpInPaise={150000} />);
    expect(screen.getByText("₹1,000")).toBeInTheDocument();
    expect(screen.getByText("₹1,500")).toBeInTheDocument();
    expect(screen.getByText("33% off")).toBeInTheDocument();
  });

  it("does not render discount when MRP equals price", () => {
    render(<PriceTag priceInPaise={100000} mrpInPaise={100000} />);
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
  });
});
