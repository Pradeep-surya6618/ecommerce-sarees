import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { ShopSort } from "@/lib/utils/shop-filters";
import type { Product, ProductDraft } from "@/types/domain";

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

// DynamoDB Products table:
//   PK = productId
//   GSI SlugIndex(slug) → for /product/<slug>
//   GSI CategoryStatusIndex(categoryId, statusCreatedAt) → list-by-category browse
//
// Naming wart: the GSI hash attribute is `categoryId` for historical reasons,
// but we actually store the category SLUG there (the domain has `categorySlug`,
// not numeric IDs). When the table is rebuilt we'll rename it to `categorySlug`.
//
// `statusCreatedAt` is a synthetic sort key `<status>#<createdAt>` so the GSI
// can serve "active products in this category, newest first" with a single
// Query (begins_with "active#").

const DEFAULT_PAGE_SIZE = 12;

function table(): string {
  return tableName(TABLES.Products);
}

function statusCreatedAt(p: Pick<Product, "status" | "createdAt">): string {
  return `${p.status}#${p.createdAt}`;
}

function toItem(product: Product): Record<string, unknown> {
  return {
    ...product,
    productId: product.id,
    categoryId: product.categorySlug,
    statusCreatedAt: statusCreatedAt(product),
  };
}

function fromItem(item: Record<string, unknown> | undefined): Product | null {
  if (!item) return null;
  const {
    productId,
    categoryId,
    statusCreatedAt: _sca,
    ...rest
  } = item as Product & {
    productId: string;
    categoryId: string;
    statusCreatedAt: string;
  };
  return {
    ...(rest as Product),
    id: productId,
    categorySlug: rest.categorySlug ?? categoryId,
  };
}

function sortNewestFirst(a: Product, b: Product): number {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}

function activeOnly(p: Product): boolean {
  return p.status === "active";
}

function applyLimit<T>(items: T[], options?: ListOptions): T[] {
  return options?.limit ? items.slice(0, options.limit) : items;
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

async function scanAll(options?: { activeOnly?: boolean }): Promise<Product[]> {
  const out: Product[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await getDdbDoc().send(
      new ScanCommand({
        TableName: table(),
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of res.Items ?? []) {
      const product = fromItem(item);
      if (!product) continue;
      if (options?.activeOnly && product.status !== "active") continue;
      out.push(product);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

async function queryByCategory(categorySlug: string, statusPrefix?: string): Promise<Product[]> {
  const out: Product[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await getDdbDoc().send(
      new QueryCommand({
        TableName: table(),
        IndexName: "CategoryStatusIndex",
        KeyConditionExpression: statusPrefix
          ? "categoryId = :c AND begins_with(statusCreatedAt, :s)"
          : "categoryId = :c",
        ExpressionAttributeValues: statusPrefix
          ? { ":c": categorySlug, ":s": statusPrefix }
          : { ":c": categorySlug },
        ExclusiveStartKey: lastKey,
        // Newer first — sort key is `<status>#<createdAt>` (ISO), so descending
        // gives newest-first within the status range.
        ScanIndexForward: false,
      }),
    );
    for (const item of res.Items ?? []) {
      const product = fromItem(item);
      if (product) out.push(product);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

export const productsRepo: ProductsRepo = {
  async list(options) {
    const items = await scanAll({ activeOnly: true });
    return applyLimit(items.sort(sortNewestFirst), options);
  },

  async listFeatured(options) {
    const items = await scanAll({ activeOnly: true });
    const featured = items.filter((p) => p.featured).sort(sortNewestFirst);
    return applyLimit(featured, options);
  },

  async listByCategory(categorySlug, options) {
    const items = await queryByCategory(categorySlug, "active#");
    return applyLimit(items, options);
  },

  async listByCategorySlugs(categorySlugs, options) {
    if (categorySlugs.length === 0) return [];
    const arrays = await Promise.all(categorySlugs.map((slug) => queryByCategory(slug, "active#")));
    const merged = arrays.flat();
    merged.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return sortNewestFirst(a, b);
    });
    return applyLimit(merged, options);
  },

  async getBySlug(slug) {
    const res = await getDdbDoc().send(
      new QueryCommand({
        TableName: table(),
        IndexName: "SlugIndex",
        KeyConditionExpression: "slug = :slug",
        ExpressionAttributeValues: { ":slug": slug },
        Limit: 1,
      }),
    );
    const product = fromItem(res.Items?.[0]);
    if (!product) return null;
    return activeOnly(product) ? product : null;
  },

  async getById(id) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { productId: id },
      }),
    );
    return fromItem(res.Item);
  },

  async search(options) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const pageSize =
      options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;

    // If a single category filter is specified, use the GSI Query. Otherwise
    // fall back to a Scan of all active products — fine until the catalog
    // grows past a few thousand items.
    let all: Product[];
    if (options.categorySlugs && options.categorySlugs.length === 1) {
      const onlySlug = options.categorySlugs[0];
      all = onlySlug ? await queryByCategory(onlySlug, "active#") : [];
    } else {
      all = await scanAll({ activeOnly: true });
    }

    const filtered = all.filter((p) => matchesFilters(p, options));
    const sorted = applySort(filtered, options.sort);
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
    const now = new Date().toISOString();
    const product: Product = {
      ...input,
      id: `prd_${nanoid(12)}`,
      createdAt: now,
    };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(product),
        ConditionExpression: "attribute_not_exists(productId)",
      }),
    );
    return product;
  },

  async update(id, input) {
    const existing = await productsRepo.getById(id);
    if (!existing) return null;
    const updated: Product = { ...existing, ...input };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(updated),
      }),
    );
    return updated;
  },

  async archive(id) {
    const existing = await productsRepo.getById(id);
    if (!existing) return null;
    const archived: Product = { ...existing, status: "archived" };
    await getDdbDoc().send(
      new UpdateCommand({
        TableName: table(),
        Key: { productId: id },
        UpdateExpression: "SET #s = :s, statusCreatedAt = :sca",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":s": "archived",
          ":sca": statusCreatedAt(archived),
        },
      }),
    );
    return archived;
  },

  async listAll(options) {
    const includeArchived = options?.includeArchived ?? false;
    const all = await scanAll();
    const filtered = includeArchived
      ? all
      : all.filter((p) => p.status === "active" || p.status === "draft");
    return filtered.sort(sortNewestFirst);
  },
};
