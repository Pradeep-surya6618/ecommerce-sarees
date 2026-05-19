import { nanoid } from "nanoid";
import { CATEGORIES_FIXTURE } from "@/lib/db/fixtures/categories";
import type { Category } from "@/types/domain";

declare global {
  var __mockCategories: Map<string, Category> | undefined;
}

function getStore(): Map<string, Category> {
  if (globalThis.__mockCategories) return globalThis.__mockCategories;
  const store = new Map<string, Category>();
  for (const c of CATEGORIES_FIXTURE) store.set(c.id, c);
  globalThis.__mockCategories = store;
  return store;
}

export interface CategoryDraft {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  parentSlug: string | null;
  sortOrder: number;
}

export interface CategoryTreeNode {
  parent: Category;
  children: Category[];
}

export interface CategoriesRepo {
  list(): Promise<Category[]>;
  listTopLevel(): Promise<Category[]>;
  listChildren(parentSlug: string): Promise<Category[]>;
  listTree(): Promise<CategoryTreeNode[]>;
  getBySlug(slug: string): Promise<Category | null>;
  getById(id: string): Promise<Category | null>;
  create(input: CategoryDraft): Promise<Category>;
  update(id: string, input: Partial<CategoryDraft>): Promise<Category | null>;
  delete(id: string): Promise<void>;
}

function bySortOrder(a: Category, b: Category): number {
  return a.sortOrder - b.sortOrder;
}

export const categoriesRepo: CategoriesRepo = {
  async list() {
    return [...getStore().values()].slice().sort(bySortOrder);
  },

  async listTopLevel() {
    return [...getStore().values()]
      .filter((c) => c.parentSlug === null)
      .slice()
      .sort(bySortOrder);
  },

  async listChildren(parentSlug) {
    return [...getStore().values()]
      .filter((c) => c.parentSlug === parentSlug)
      .slice()
      .sort(bySortOrder);
  },

  async listTree() {
    const all = [...getStore().values()];
    const parents = all.filter((c) => c.parentSlug === null).sort(bySortOrder);
    return parents.map((parent) => ({
      parent,
      children: all.filter((c) => c.parentSlug === parent.slug).sort(bySortOrder),
    }));
  },

  async getBySlug(slug) {
    return [...getStore().values()].find((c) => c.slug === slug) ?? null;
  },

  async getById(id) {
    return getStore().get(id) ?? null;
  },

  async create(input) {
    const store = getStore();
    const existing = [...store.values()].find((c) => c.slug === input.slug);
    if (existing) {
      throw new Error(`A category with slug "${input.slug}" already exists.`);
    }
    const category: Category = {
      id: `cat_${nanoid(12)}`,
      ...input,
    };
    store.set(category.id, category);
    return category;
  },

  async update(id, input) {
    const store = getStore();
    const existing = store.get(id);
    if (!existing) return null;
    if (input.slug && input.slug !== existing.slug) {
      const clash = [...store.values()].find((c) => c.slug === input.slug && c.id !== id);
      if (clash) {
        throw new Error(`A category with slug "${input.slug}" already exists.`);
      }
    }
    const updated: Category = { ...existing, ...input };
    store.set(id, updated);
    return updated;
  },

  async delete(id) {
    getStore().delete(id);
  },
};

export function __resetCategoriesRepo(): void {
  globalThis.__mockCategories = undefined;
}
