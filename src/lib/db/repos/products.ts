import { PRODUCTS_FIXTURE } from "@/lib/db/fixtures/products";
import type { Product } from "@/types/domain";

export interface ListOptions {
  limit?: number;
}

export interface ProductsRepo {
  list(options?: ListOptions): Promise<Product[]>;
  listFeatured(options?: ListOptions): Promise<Product[]>;
  listByCategory(categorySlug: string, options?: ListOptions): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  getById(id: string): Promise<Product | null>;
}

function applyLimit<T>(items: T[], options?: ListOptions): T[] {
  return options?.limit ? items.slice(0, options.limit) : items;
}

function sortNewestFirst(a: Product, b: Product): number {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}

function activeOnly(p: Product): boolean {
  return p.status === "active";
}

export const productsRepo: ProductsRepo = {
  async list(options) {
    const items = PRODUCTS_FIXTURE.filter(activeOnly).slice().sort(sortNewestFirst);
    return applyLimit(items, options);
  },

  async listFeatured(options) {
    const items = PRODUCTS_FIXTURE.filter((p) => activeOnly(p) && p.featured)
      .slice()
      .sort(sortNewestFirst);
    return applyLimit(items, options);
  },

  async listByCategory(categorySlug, options) {
    const items = PRODUCTS_FIXTURE.filter((p) => activeOnly(p) && p.categorySlug === categorySlug)
      .slice()
      .sort(sortNewestFirst);
    return applyLimit(items, options);
  },

  async getBySlug(slug) {
    return PRODUCTS_FIXTURE.find((p) => p.slug === slug && activeOnly(p)) ?? null;
  },

  async getById(id) {
    return PRODUCTS_FIXTURE.find((p) => p.id === id && activeOnly(p)) ?? null;
  },
};
