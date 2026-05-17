export type ShopSort = "newest" | "price-asc" | "price-desc" | "featured";

export interface ShopFilters {
  fabrics: string[];
  colors: string[];
  occasions: string[];
  priceMinPaise?: number;
  priceMaxPaise?: number;
  inStockOnly?: boolean;
  sort: ShopSort;
  page: number;
}

const ALLOWED_SORTS: ShopSort[] = ["newest", "price-asc", "price-desc", "featured"];

type RawParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseList(value: string | string[] | undefined): string[] {
  const raw = firstParam(value);
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parsePaise(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function parseSort(value: string | undefined): ShopSort {
  if (value && (ALLOWED_SORTS as string[]).includes(value)) return value as ShopSort;
  return "newest";
}

export function parseShopFilters(params: RawParams): ShopFilters {
  return {
    fabrics: parseList(params.fabric),
    colors: parseList(params.color),
    occasions: parseList(params.occasion),
    priceMinPaise: parsePaise(firstParam(params.minPrice)),
    priceMaxPaise: parsePaise(firstParam(params.maxPrice)),
    inStockOnly: firstParam(params.inStock) === "1" ? true : undefined,
    sort: parseSort(firstParam(params.sort)),
    page: parsePositiveInt(firstParam(params.page), 1),
  };
}

export function serializeShopFilters(filters: ShopFilters): string {
  const params = new URLSearchParams();
  if (filters.fabrics.length > 0) params.set("fabric", filters.fabrics.join(","));
  if (filters.colors.length > 0) params.set("color", filters.colors.join(","));
  if (filters.occasions.length > 0) params.set("occasion", filters.occasions.join(","));
  if (typeof filters.priceMinPaise === "number")
    params.set("minPrice", String(filters.priceMinPaise));
  if (typeof filters.priceMaxPaise === "number")
    params.set("maxPrice", String(filters.priceMaxPaise));
  if (filters.inStockOnly) params.set("inStock", "1");
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}
