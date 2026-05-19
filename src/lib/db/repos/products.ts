import { nanoid } from "nanoid";
import { PRODUCTS_FIXTURE } from "@/lib/db/fixtures/products";
import type { ShopSort } from "@/lib/utils/shop-filters";
import type { Product, ProductDraft } from "@/types/domain";

declare global {
  var __mockProducts: Map<string, Product> | undefined;
}

function getStore(): Map<string, Product> {
  if (globalThis.__mockProducts) return globalThis.__mockProducts;
  const store = new Map<string, Product>();
  for (const p of PRODUCTS_FIXTURE) store.set(p.id, p);
  globalThis.__mockProducts = store;
  return store;
}

function nowIso(): string {
  return new Date().toISOString();
}

export interface ListOptions {
  limit?: number;
}

export interface SearchOptions {
  q?: string;
  categorySlugs?: string[];
  fabrics?: string[];
  colors?: string[];
  occasions?: string[];
  priceMinPaise?: number;
  priceMaxPaise?: number;
  inStockOnly?: boolean;
  sort?: ShopSort;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  items: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ListAllOptions {
  includeArchived?: boolean;
}

export interface ProductsRepo {
  list(options?: ListOptions): Promise<Product[]>;
  listFeatured(options?: ListOptions): Promise<Product[]>;
  listByCategory(categorySlug: string, options?: ListOptions): Promise<Product[]>;
  listByCategorySlugs(categorySlugs: string[], options?: ListOptions): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  getById(id: string): Promise<Product | null>;
  search(options: SearchOptions): Promise<SearchResult>;
  create(input: ProductDraft): Promise<Product>;
  update(id: string, input: Partial<ProductDraft>): Promise<Product | null>;
  archive(id: string): Promise<Product | null>;
  listAll(options?: ListAllOptions): Promise<Product[]>;
}

const DEFAULT_PAGE_SIZE = 12;

function applyLimit<T>(items: T[], options?: ListOptions): T[] {
  return options?.limit ? items.slice(0, options.limit) : items;
}

function sortNewestFirst(a: Product, b: Product): number {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}

function activeOnly(p: Product): boolean {
  return p.status === "active";
}

function applySort(items: Product[], sort: ShopSort | undefined): Product[] {
  const arr = items.slice();
  if (sort === "price-asc") return arr.sort((a, b) => a.priceInPaise - b.priceInPaise);
  if (sort === "price-desc") return arr.sort((a, b) => b.priceInPaise - a.priceInPaise);
  if (sort === "featured")
    return arr.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return sortNewestFirst(a, b);
    });
  return arr.sort(sortNewestFirst);
}

function lowerSet(values: string[]): Set<string> {
  return new Set(values.map((v) => v.toLowerCase()));
}

function matchesFilters(p: Product, o: SearchOptions): boolean {
  if (o.q && o.q.trim().length > 0) {
    const needle = o.q.trim().toLowerCase();
    const haystack = [
      p.name,
      p.description,
      p.fabric,
      p.categorySlug,
      ...p.tags,
      ...p.occasion,
      ...p.variants.map((v) => v.colorName),
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (o.categorySlugs && o.categorySlugs.length > 0) {
    if (!o.categorySlugs.includes(p.categorySlug)) return false;
  }
  if (o.fabrics && o.fabrics.length > 0) {
    const wanted = lowerSet(o.fabrics);
    const fabricLc = p.fabric.toLowerCase();
    const ok = [...wanted].some((f) => fabricLc.includes(f));
    if (!ok) return false;
  }
  if (o.colors && o.colors.length > 0) {
    const wanted = lowerSet(o.colors);
    const ok = p.variants.some((v) => wanted.has(v.colorName.toLowerCase()));
    if (!ok) return false;
  }
  if (o.occasions && o.occasions.length > 0) {
    const wanted = lowerSet(o.occasions);
    const ok = p.occasion.some((o2) => wanted.has(o2.toLowerCase()));
    if (!ok) return false;
  }
  if (typeof o.priceMinPaise === "number" && p.priceInPaise < o.priceMinPaise) return false;
  if (typeof o.priceMaxPaise === "number" && p.priceInPaise > o.priceMaxPaise) return false;
  if (o.inStockOnly) {
    if (!p.variants.some((v) => v.stock > 0)) return false;
  }
  return true;
}

export const productsRepo: ProductsRepo = {
  async list(options) {
    const items = [...getStore().values()].filter(activeOnly).slice().sort(sortNewestFirst);
    return applyLimit(items, options);
  },

  async listFeatured(options) {
    const items = [...getStore().values()]
      .filter((p) => activeOnly(p) && p.featured)
      .slice()
      .sort(sortNewestFirst);
    return applyLimit(items, options);
  },

  async listByCategory(categorySlug, options) {
    const items = [...getStore().values()]
      .filter((p) => activeOnly(p) && p.categorySlug === categorySlug)
      .slice()
      .sort(sortNewestFirst);
    return applyLimit(items, options);
  },

  async listByCategorySlugs(categorySlugs, options) {
    if (categorySlugs.length === 0) return [];
    const set = new Set(categorySlugs);
    const items = [...getStore().values()]
      .filter((p) => activeOnly(p) && set.has(p.categorySlug))
      .slice()
      .sort((a, b) => {
        // Featured first, then newest
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return sortNewestFirst(a, b);
      });
    return applyLimit(items, options);
  },

  async getBySlug(slug) {
    return [...getStore().values()].find((p) => p.slug === slug && activeOnly(p)) ?? null;
  },

  async getById(id) {
    return getStore().get(id) ?? null;
  },

  async search(options) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const pageSize =
      options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;
    const all = [...getStore().values()]
      .filter(activeOnly)
      .filter((p) => matchesFilters(p, options));
    const sorted = applySort(all, options.sort);
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);
    return {
      items,
      totalCount: sorted.length,
      page,
      pageSize,
      hasMore: start + items.length < sorted.length,
    };
  },

  async create(input) {
    const store = getStore();
    const now = nowIso();
    const product: Product = {
      ...input,
      id: `prd_${nanoid(12)}`,
      createdAt: now,
    };
    store.set(product.id, product);
    return product;
  },

  async update(id, input) {
    const store = getStore();
    const existing = store.get(id);
    if (!existing) return null;
    const updated: Product = { ...existing, ...input };
    store.set(id, updated);
    return updated;
  },

  async archive(id) {
    const store = getStore();
    const existing = store.get(id);
    if (!existing) return null;
    const archived: Product = { ...existing, status: "archived" };
    store.set(id, archived);
    return archived;
  },

  async listAll(options) {
    const includeArchived = options?.includeArchived ?? false;
    const all = [...getStore().values()];
    const filtered = includeArchived
      ? all
      : all.filter((p) => p.status === "active" || p.status === "draft");
    return filtered.slice().sort(sortNewestFirst);
  },
};

export function __resetProductsRepo(): void {
  const store = getStore();
  store.clear();
  for (const p of PRODUCTS_FIXTURE) store.set(p.id, p);
}
