import { describe, expect, it } from "vitest";
import { reviewsRepo } from "./reviews";

describe("reviewsRepo (mock)", () => {
  it("lists site-wide reviews (productId null) plus a sample, newest first", async () => {
    const result = await reviewsRepo.listFeatured({ limit: 5 });
    expect(result.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.createdAt >= result[i]!.createdAt).toBe(true);
    }
  });

  it("lists reviews for a specific product", async () => {
    const result = await reviewsRepo.listByProduct("prd_amrita");
    expect(result.every((r) => r.productId === "prd_amrita")).toBe(true);
  });
});
