import { describe, expect, it } from "vitest";
import { categoriesRepo } from "./categories";

describe("categoriesRepo (mock)", () => {
  it("lists categories sorted by sortOrder asc", async () => {
    const result = await categoriesRepo.list();
    expect(result.length).toBeGreaterThan(0);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.sortOrder <= result[i]!.sortOrder).toBe(true);
    }
  });

  it("lists only top-level categories", async () => {
    const result = await categoriesRepo.listTopLevel();
    expect(result.every((c) => c.parentSlug === null)).toBe(true);
  });

  it("gets a category by slug", async () => {
    const cat = await categoriesRepo.getBySlug("silk");
    expect(cat?.name).toBe("Silk Sarees");
  });

  it("returns null for unknown slug", async () => {
    expect(await categoriesRepo.getBySlug("nope")).toBeNull();
  });
});
