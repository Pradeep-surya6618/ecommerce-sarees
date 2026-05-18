import { beforeEach, describe, expect, it } from "vitest";
import { __resetCategoriesRepo, categoriesRepo } from "./categories";

describe("categoriesRepo (mock)", () => {
  beforeEach(() => __resetCategoriesRepo());

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

  it("creates a new category with cat_ prefixed id", async () => {
    const created = await categoriesRepo.create({
      slug: "new-cat",
      name: "New Category",
      description: "Test",
      imageUrl: "https://example.com/x.jpg",
      parentSlug: null,
      sortOrder: 99,
    });
    expect(created.id).toMatch(/^cat_/);
    expect(await categoriesRepo.getBySlug("new-cat")).not.toBeNull();
  });

  it("rejects duplicate slugs on create", async () => {
    await expect(
      categoriesRepo.create({
        slug: "silk",
        name: "Dup",
        description: "x",
        imageUrl: "https://x/y.jpg",
        parentSlug: null,
        sortOrder: 100,
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("updates a category", async () => {
    const created = await categoriesRepo.create({
      slug: "for-update",
      name: "Original",
      description: "x",
      imageUrl: "https://x/y.jpg",
      parentSlug: null,
      sortOrder: 50,
    });
    const updated = await categoriesRepo.update(created.id, { name: "Renamed" });
    expect(updated?.name).toBe("Renamed");
  });

  it("rejects slug change to an existing slug", async () => {
    const created = await categoriesRepo.create({
      slug: "before-clash",
      name: "X",
      description: "x",
      imageUrl: "https://x/y.jpg",
      parentSlug: null,
      sortOrder: 60,
    });
    await expect(categoriesRepo.update(created.id, { slug: "silk" })).rejects.toThrow(
      /already exists/,
    );
  });

  it("deletes a category", async () => {
    const created = await categoriesRepo.create({
      slug: "to-delete",
      name: "Temp",
      description: "x",
      imageUrl: "https://x/y.jpg",
      parentSlug: null,
      sortOrder: 70,
    });
    await categoriesRepo.delete(created.id);
    expect(await categoriesRepo.getBySlug("to-delete")).toBeNull();
  });
});
