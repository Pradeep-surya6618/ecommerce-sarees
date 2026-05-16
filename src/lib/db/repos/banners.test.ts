import { describe, expect, it } from "vitest";
import { bannersRepo } from "./banners";

describe("bannersRepo (mock)", () => {
  it("lists active banners by placement sorted by sortOrder", async () => {
    const result = await bannersRepo.listByPlacement("home-hero");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((b) => b.placement === "home-hero" && b.active)).toBe(true);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.sortOrder <= result[i]!.sortOrder).toBe(true);
    }
  });

  it("returns empty for an unknown placement", async () => {
    const result = await bannersRepo.listByPlacement("shop-strip");
    expect(result).toEqual([]);
  });
});
