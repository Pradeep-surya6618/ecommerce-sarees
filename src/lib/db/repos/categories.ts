import { CATEGORIES_FIXTURE } from "@/lib/db/fixtures/categories";
import type { Category } from "@/types/domain";

export interface CategoriesRepo {
  list(): Promise<Category[]>;
  listTopLevel(): Promise<Category[]>;
  getBySlug(slug: string): Promise<Category | null>;
}

function bySortOrder(a: Category, b: Category): number {
  return a.sortOrder - b.sortOrder;
}

export const categoriesRepo: CategoriesRepo = {
  async list() {
    return CATEGORIES_FIXTURE.slice().sort(bySortOrder);
  },

  async listTopLevel() {
    return CATEGORIES_FIXTURE.filter((c) => c.parentSlug === null)
      .slice()
      .sort(bySortOrder);
  },

  async getBySlug(slug) {
    return CATEGORIES_FIXTURE.find((c) => c.slug === slug) ?? null;
  },
};
