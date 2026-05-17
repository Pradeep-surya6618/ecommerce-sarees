import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { computePageWindow, Pagination } from "./Pagination";

describe("computePageWindow", () => {
  it("returns all pages when total is small", () => {
    expect(computePageWindow(1, 3)).toEqual([1, 2, 3]);
  });

  it("shows current with neighbors and edges", () => {
    expect(computePageWindow(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });

  it("anchors at start", () => {
    expect(computePageWindow(2, 10)).toEqual([1, 2, 3, "...", 10]);
  });

  it("anchors at end", () => {
    expect(computePageWindow(9, 10)).toEqual([1, "...", 8, 9, 10]);
  });
});

describe("Pagination", () => {
  it("renders links using buildHref", () => {
    render(<Pagination currentPage={2} totalPages={5} buildHref={(p) => `/shop?page=${p}`} />);
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute("href", "/shop?page=1");
    expect(screen.getByRole("link", { name: "Page 3" })).toHaveAttribute("href", "/shop?page=3");
  });

  it("does not render when totalPages <= 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} buildHref={() => "#"} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
