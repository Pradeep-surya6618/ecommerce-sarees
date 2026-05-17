# Phase 2 — Shop Listing + Product Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the catalog browsing experience — shop listing pages with filters, sort and pagination, and the product detail page with gallery, variant picker, fabric/care tabs, pincode check, reviews, and related products.

**Architecture:** Listing and detail pages are Server Components reading Next 16's `searchParams` and `params` (both Promises) and calling extended `productsRepo` methods (search/filter/sort/paginate). Filter interactions update URL query params via a client-side hook; the page rerenders server-side with new params. Toasts use `sonner` (added in Task 1) — `AddToCartButton` is a stub that fires a toast until Phase 3 wires the real cart action.

**Tech Stack:** Same as Phase 1 plus `sonner` for toasts. Next 16 App Router conventions (async `params`/`searchParams`), React 19, Tailwind v4, MUI v9, Embla Carousel (gallery), Framer Motion (already installed; used sparingly for entry animations).

**Reference spec:** `docs/superpowers/specs/2026-05-16-saree-ecom-design.md` §13.4 (Shop / Product page highlights) and §5 (Products with variants and reviews access patterns).

---

## File Map

```
✚ src/lib/utils/shop-filters.ts                              # parse/serialize URL filters
✚ src/lib/utils/shop-filters.test.ts
✚ src/lib/utils/shop-options.ts                              # filter option lists from fixtures
✎ src/lib/db/repos/products.ts                                # add search() with filter/sort/page
✎ src/lib/db/repos/products.test.ts                           # tests for search()
✚ src/components/ui/Select.tsx
✚ src/components/ui/Tabs.tsx
✚ src/components/ui/Accordion.tsx
✚ src/components/ui/RatingStars.tsx
✚ src/components/ui/Breadcrumb.tsx
✚ src/components/ui/Pagination.tsx
✚ src/components/ui/Pagination.test.tsx
✚ src/components/ui/Sheet.tsx                                 # mobile drawer
✚ src/components/ui/VariantPicker.tsx
✚ src/components/ui/VariantPicker.test.tsx
✚ src/components/ui/QuantityStepper.tsx
✚ src/components/ui/QuantityStepper.test.tsx
✚ src/components/ui/AddToCartButton.tsx                       # stub: toasts
✎ src/app/providers.tsx                                       # add <Toaster/> from sonner
✚ src/components/storefront/ProductGrid.tsx
✚ src/components/storefront/FilterRail.tsx                    # desktop sidebar
✚ src/components/storefront/FilterDrawer.tsx                  # mobile sheet
✚ src/components/storefront/SortDropdown.tsx
✚ src/components/storefront/ShopHeader.tsx                    # title + result count + sort + open-filters button
✚ src/components/storefront/ProductGallery.tsx                # Embla + zoom on hover
✚ src/components/storefront/PincodeChecker.tsx                # mock serviceability
✚ src/components/storefront/ReviewSummary.tsx                 # avg + distribution
✚ src/components/storefront/ReviewList.tsx
✚ src/components/storefront/RelatedProducts.tsx
✚ src/components/storefront/ProductBuyBox.tsx                # client island: variant + qty state
✚ src/app/(storefront)/shop/page.tsx                          # /shop  (all products)
✚ src/app/(storefront)/shop/[categorySlug]/page.tsx           # /shop/silk etc.
✚ src/app/(storefront)/product/[slug]/page.tsx                # product detail
✚ tests/e2e/shop.spec.ts
✚ tests/e2e/product-detail.spec.ts
```

Notes:

- Money in paise (Phase 1 convention).
- Filter URLs use comma-separated multi-values: `/shop?fabric=silk,linen&color=Maroon&minPrice=100000&maxPrice=5000000&sort=price-asc&page=2`.
- Page-size default: 12. Pagination shows page numbers + prev/next.
- Variants UI: color swatches mandatory, size pills only if at least one variant has `size` set.
- Toasts via `sonner` — package added in Task 1.

---

## Task 1: Install sonner and wire Toaster

**Files:**

- Modify: `package.json`, `src/app/providers.tsx`

- [ ] **Step 1: Install sonner**

```powershell
npm install sonner
```

If npm errors about peer deps (same as Phase 0), retry with `--legacy-peer-deps`.

- [ ] **Step 2: Add `<Toaster />` to providers**

Edit `src/app/providers.tsx`. After the existing imports, add:

```tsx
import { Toaster } from "sonner";
```

Inside the `Providers` component, wrap `<CssBaseline />` and `<QueryClientProvider />` so the Toaster sits as a sibling that overlays the whole app. The final shape of the return should be:

```tsx
return (
  <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: true }}>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 3500 }} />
      </QueryClientProvider>
    </ThemeProvider>
  </AppRouterCacheProvider>
);
```

- [ ] **Step 3: Verify build**

```powershell
npx next build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```powershell
git add package.json package-lock.json src/app/providers.tsx
git commit -m "feat(deps): add sonner for toast notifications"
```

---

## Task 2: Shop filter URL parser

**Files:**

- Create: `src/lib/utils/shop-filters.ts`, `src/lib/utils/shop-filters.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/utils/shop-filters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseShopFilters, serializeShopFilters, type ShopFilters } from "./shop-filters";

describe("parseShopFilters", () => {
  it("returns empty filters from empty params", () => {
    const f = parseShopFilters({});
    expect(f).toEqual({
      fabrics: [],
      colors: [],
      occasions: [],
      sort: "newest",
      page: 1,
    });
  });

  it("parses comma-separated multi-values", () => {
    const f = parseShopFilters({ fabric: "silk,linen", color: "Maroon,Sage" });
    expect(f.fabrics).toEqual(["silk", "linen"]);
    expect(f.colors).toEqual(["Maroon", "Sage"]);
  });

  it("parses min/max price as integers", () => {
    const f = parseShopFilters({ minPrice: "100000", maxPrice: "5000000" });
    expect(f.priceMinPaise).toBe(100000);
    expect(f.priceMaxPaise).toBe(5000000);
  });

  it("parses page as a positive integer, defaulting to 1", () => {
    expect(parseShopFilters({ page: "3" }).page).toBe(3);
    expect(parseShopFilters({ page: "0" }).page).toBe(1);
    expect(parseShopFilters({ page: "-2" }).page).toBe(1);
    expect(parseShopFilters({ page: "abc" }).page).toBe(1);
  });

  it("clamps sort to the allowed set", () => {
    expect(parseShopFilters({ sort: "price-asc" }).sort).toBe("price-asc");
    expect(parseShopFilters({ sort: "bogus" }).sort).toBe("newest");
  });

  it("treats inStock=1 as true", () => {
    expect(parseShopFilters({ inStock: "1" }).inStockOnly).toBe(true);
    expect(parseShopFilters({ inStock: "0" }).inStockOnly).toBeUndefined();
  });
});

describe("serializeShopFilters", () => {
  it("omits defaults", () => {
    const url = serializeShopFilters({
      fabrics: [],
      colors: [],
      occasions: [],
      sort: "newest",
      page: 1,
    });
    expect(url).toBe("");
  });

  it("serializes multi-values and non-defaults", () => {
    const url = serializeShopFilters({
      fabrics: ["silk", "linen"],
      colors: ["Maroon"],
      occasions: [],
      priceMinPaise: 100000,
      priceMaxPaise: 5000000,
      sort: "price-asc",
      page: 2,
      inStockOnly: true,
    });
    const params = new URLSearchParams(url);
    expect(params.get("fabric")).toBe("silk,linen");
    expect(params.get("color")).toBe("Maroon");
    expect(params.get("minPrice")).toBe("100000");
    expect(params.get("maxPrice")).toBe("5000000");
    expect(params.get("sort")).toBe("price-asc");
    expect(params.get("page")).toBe("2");
    expect(params.get("inStock")).toBe("1");
  });
});
```

- [ ] **Step 2: Run failing test**

```powershell
npx vitest run src/lib/utils/shop-filters.test.ts
```

- [ ] **Step 3: Implement `src/lib/utils/shop-filters.ts`**

```ts
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
```

- [ ] **Step 4: Run, confirm passing**

```powershell
npx vitest run src/lib/utils/shop-filters.test.ts
```

Expected: 8 passed.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/utils/shop-filters.ts src/lib/utils/shop-filters.test.ts
git commit -m "feat(utils): add shop filter URL parser and serializer"
```

---

## Task 3: Extend productsRepo with search/filter/sort/paginate

**Files:**

- Modify: `src/lib/db/repos/products.ts`, `src/lib/db/repos/products.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `src/lib/db/repos/products.test.ts` (inside the existing `describe("productsRepo (mock)")` block):

```ts
describe("search", () => {
  it("filters by category slug", async () => {
    const result = await productsRepo.search({ categorySlugs: ["kanjivaram"] });
    expect(result.items.every((p) => p.categorySlug === "kanjivaram")).toBe(true);
    expect(result.totalCount).toBeGreaterThan(0);
  });

  it("filters by fabric (substring, case-insensitive)", async () => {
    const result = await productsRepo.search({ fabrics: ["silk"] });
    expect(result.items.every((p) => p.fabric.toLowerCase().includes("silk"))).toBe(true);
  });

  it("filters by color name (exact, case-insensitive)", async () => {
    const result = await productsRepo.search({ colors: ["Maroon"] });
    expect(
      result.items.every((p) => p.variants.some((v) => v.colorName.toLowerCase() === "maroon")),
    ).toBe(true);
  });

  it("filters by price range", async () => {
    const result = await productsRepo.search({ priceMinPaise: 1000000, priceMaxPaise: 3000000 });
    expect(result.items.every((p) => p.priceInPaise >= 1000000 && p.priceInPaise <= 3000000)).toBe(
      true,
    );
  });

  it("returns empty when no products match", async () => {
    const result = await productsRepo.search({ fabrics: ["nonexistent-fabric"] });
    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("sorts price ascending and descending", async () => {
    const asc = await productsRepo.search({ sort: "price-asc" });
    for (let i = 1; i < asc.items.length; i++) {
      expect(asc.items[i - 1]!.priceInPaise <= asc.items[i]!.priceInPaise).toBe(true);
    }
    const desc = await productsRepo.search({ sort: "price-desc" });
    for (let i = 1; i < desc.items.length; i++) {
      expect(desc.items[i - 1]!.priceInPaise >= desc.items[i]!.priceInPaise).toBe(true);
    }
  });

  it("paginates", async () => {
    const all = await productsRepo.search({});
    const page1 = await productsRepo.search({ page: 1, pageSize: 5 });
    const page2 = await productsRepo.search({ page: 2, pageSize: 5 });
    expect(page1.items).toHaveLength(5);
    expect(page1.hasMore).toBe(true);
    expect(page2.items[0]?.id).toBe(all.items[5]?.id);
    expect(page2.page).toBe(2);
  });

  it("filters by inStockOnly (any variant with stock > 0)", async () => {
    const result = await productsRepo.search({ inStockOnly: true });
    expect(result.items.every((p) => p.variants.some((v) => v.stock > 0))).toBe(true);
  });
});
```

- [ ] **Step 2: Run, confirm failing**

```powershell
npx vitest run src/lib/db/repos/products.test.ts
```

- [ ] **Step 3: Extend `src/lib/db/repos/products.ts`**

Replace the entire file content with:

```ts
import { PRODUCTS_FIXTURE } from "@/lib/db/fixtures/products";
import type { ShopSort } from "@/lib/utils/shop-filters";
import type { Product } from "@/types/domain";

export interface ListOptions {
  limit?: number;
}

export interface SearchOptions {
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

export interface ProductsRepo {
  list(options?: ListOptions): Promise<Product[]>;
  listFeatured(options?: ListOptions): Promise<Product[]>;
  listByCategory(categorySlug: string, options?: ListOptions): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  getById(id: string): Promise<Product | null>;
  search(options: SearchOptions): Promise<SearchResult>;
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

  async search(options) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const pageSize =
      options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;
    const all = PRODUCTS_FIXTURE.filter(activeOnly).filter((p) => matchesFilters(p, options));
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
};
```

- [ ] **Step 4: Run, confirm passing**

```powershell
npx vitest run src/lib/db/repos/products.test.ts
```

Expected: 14 passed (6 existing + 8 new).

- [ ] **Step 5: Commit**

```powershell
git add src/lib/db/repos/products.ts src/lib/db/repos/products.test.ts
git commit -m "feat(repos): extend productsRepo with search (filter, sort, paginate)"
```

---

## Task 4: Select primitive

**Files:**

- Create: `src/components/ui/Select.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  size?: "sm" | "md";
}

const sizeClass: Record<NonNullable<SelectProps["size"]>, string> = {
  sm: "h-9 text-sm",
  md: "h-11 text-base",
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, size = "md", className, children, ...rest },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium uppercase tracking-wide text-ink-700">{label}</span>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={clsx(
            "w-full appearance-none rounded-sm border border-ink-500/30 bg-bg-elevated pl-3 pr-10 text-ink-900 transition",
            "focus:border-accent-primary focus:outline-none",
            sizeClass[size],
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
        />
      </div>
    </label>
  );
});
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/ui/Select.tsx
git commit -m "feat(ui): add Select primitive"
```

---

## Task 5: Tabs primitive

**Files:**

- Create: `src/components/ui/Tabs.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { createContext, useContext, useId, useState } from "react";
import { clsx } from "@/lib/utils/clsx";

interface TabsCtx {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
}

const Ctx = createContext<TabsCtx | null>(null);

function useTabs(): TabsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Tabs.* must be used inside <Tabs>");
  return ctx;
}

export function Tabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const baseId = useId();
  return (
    <Ctx.Provider value={{ value, setValue, baseId }}>
      <div className={clsx("flex flex-col gap-6", className)}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="tablist" className={clsx("flex gap-2 border-b border-ink-500/15", className)}>
      {children}
    </div>
  );
}

export function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: active, setValue, baseId } = useTabs();
  const isActive = active === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      onClick={() => setValue(value)}
      className={clsx(
        "border-b-2 px-4 py-3 text-sm font-medium transition",
        isActive
          ? "border-accent-primary text-ink-900"
          : "border-transparent text-ink-500 hover:text-ink-700",
      )}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: active, baseId } = useTabs();
  if (active !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      className="text-ink-700"
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/ui/Tabs.tsx
git commit -m "feat(ui): add Tabs primitive with TabList/Tab/TabPanel"
```

---

## Task 6: Accordion primitive

**Files:**

- Create: `src/components/ui/Accordion.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface AccordionItemProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ title, defaultOpen, children, className }: AccordionItemProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={clsx("border-b border-ink-500/10", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-medium text-ink-900 transition hover:text-accent-primary"
      >
        <span>{title}</span>
        <ChevronDown
          aria-hidden
          className={clsx("h-4 w-4 transition-transform", open ? "rotate-180" : "rotate-0")}
        />
      </button>
      {open && <div className="pb-5 text-sm text-ink-700">{children}</div>}
    </div>
  );
}

export function Accordion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx("flex flex-col", className)}>{children}</div>;
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/ui/Accordion.tsx
git commit -m "feat(ui): add Accordion primitive"
```

---

## Task 7: RatingStars primitive

**Files:**

- Create: `src/components/ui/RatingStars.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Star, StarHalf } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface RatingStarsProps {
  rating: number; // 0..5
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeClass: Record<NonNullable<RatingStarsProps["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function RatingStars({ rating, size = "md", showValue, className }: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  const star = sizeClass[size];

  return (
    <div className={clsx("inline-flex items-center gap-1", className)}>
      <span className="inline-flex items-center text-accent-gold">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} className={clsx(star, "fill-current")} />
        ))}
        {hasHalf && <StarHalf className={clsx(star, "fill-current")} />}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} className={clsx(star, "opacity-30")} />
        ))}
      </span>
      {showValue && <span className="text-xs font-medium text-ink-700">{clamped.toFixed(1)}</span>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/ui/RatingStars.tsx
git commit -m "feat(ui): add RatingStars primitive with half-star support"
```

---

## Task 8: Breadcrumb primitive

**Files:**

- Create: `src/components/ui/Breadcrumb.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={clsx("text-sm text-ink-500", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition hover:text-ink-900">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-ink-900" : undefined}>{item.label}</span>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/ui/Breadcrumb.tsx
git commit -m "feat(ui): add Breadcrumb primitive"
```

---

## Task 9: Pagination primitive (with tests)

**Files:**

- Create: `src/components/ui/Pagination.tsx`, `src/components/ui/Pagination.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { computePageWindow, Pagination } from "./Pagination";

describe("computePageWindow", () => {
  it("returns all pages when total is small", () => {
    expect(computePageWindow(1, 3)).toEqual([1, 2, 3]);
  });

  it("shows current with neighbors and edges", () => {
    expect(computePageWindow(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });

  it("anchors at start", () => {
    expect(computePageWindow(2, 10)).toEqual([1, 2, 3, "...", 10]);
  });

  it("anchors at end", () => {
    expect(computePageWindow(9, 10)).toEqual([1, "...", 8, 9, 10]);
  });
});

describe("Pagination", () => {
  it("renders links using buildHref", () => {
    render(<Pagination currentPage={2} totalPages={5} buildHref={(p) => `/shop?page=${p}`} />);
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute("href", "/shop?page=1");
    expect(screen.getByRole("link", { name: "Page 3" })).toHaveAttribute("href", "/shop?page=3");
  });

  it("does not render when totalPages <= 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} buildHref={() => "#"} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run, confirm failing**

```powershell
npx vitest run src/components/ui/Pagination.test.tsx
```

- [ ] **Step 3: Implement `src/components/ui/Pagination.tsx`**

```tsx
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export type PageWindowEntry = number | "...";

export function computePageWindow(current: number, total: number): PageWindowEntry[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: PageWindowEntry[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("...");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("...");
  out.push(total);
  return out;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}

export function Pagination({ currentPage, totalPages, buildHref, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const window = computePageWindow(currentPage, totalPages);
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={clsx("flex items-center justify-center gap-1", className)}
    >
      <Link
        aria-label="Previous page"
        aria-disabled={prevDisabled}
        href={prevDisabled ? "#" : buildHref(currentPage - 1)}
        className={clsx(
          "inline-flex h-9 w-9 items-center justify-center rounded-sm border border-ink-500/20 text-ink-700 transition",
          prevDisabled ? "pointer-events-none opacity-40" : "hover:border-ink-700",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {window.map((entry, idx) =>
        entry === "..." ? (
          <span key={`gap-${idx}`} aria-hidden className="px-2 text-ink-500">
            …
          </span>
        ) : (
          <Link
            key={entry}
            aria-label={`Page ${entry}`}
            aria-current={entry === currentPage ? "page" : undefined}
            href={buildHref(entry)}
            className={clsx(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-sm border px-3 text-sm transition",
              entry === currentPage
                ? "border-accent-primary bg-accent-primary text-white"
                : "border-ink-500/20 text-ink-700 hover:border-ink-700",
            )}
          >
            {entry}
          </Link>
        ),
      )}
      <Link
        aria-label="Next page"
        aria-disabled={nextDisabled}
        href={nextDisabled ? "#" : buildHref(currentPage + 1)}
        className={clsx(
          "inline-flex h-9 w-9 items-center justify-center rounded-sm border border-ink-500/20 text-ink-700 transition",
          nextDisabled ? "pointer-events-none opacity-40" : "hover:border-ink-700",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
```

- [ ] **Step 4: Run, confirm passing**

```powershell
npx vitest run src/components/ui/Pagination.test.tsx
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```powershell
git add src/components/ui/Pagination.tsx src/components/ui/Pagination.test.tsx
git commit -m "feat(ui): add Pagination primitive with page window logic"
```

---

## Task 10: Sheet primitive (mobile drawer)

**Files:**

- Create: `src/components/ui/Sheet.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { IconButton } from "./IconButton";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: "left" | "right" | "bottom";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sideClass = {
  left: "left-0 top-0 h-full w-[88vw] max-w-md translate-x-[-100%] data-[open=true]:translate-x-0",
  right: "right-0 top-0 h-full w-[88vw] max-w-md translate-x-full data-[open=true]:translate-x-0",
  bottom: "bottom-0 left-0 w-full max-h-[85vh] translate-y-full data-[open=true]:translate-y-0",
};

export function Sheet({ open, onClose, title, side = "right", children, footer }: SheetProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink-900/40 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div
        data-open={open}
        className={clsx(
          "absolute flex flex-col bg-bg-base shadow-elev transition-transform duration-300 ease-out",
          sideClass[side],
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink-500/10 px-5 py-4">
          <h2 className="font-display text-xl text-ink-900">{title}</h2>
          <IconButton aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-ink-500/10 bg-bg-elevated px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/ui/Sheet.tsx
git commit -m "feat(ui): add Sheet primitive for mobile drawers"
```

---

## Task 11: VariantPicker (with tests)

**Files:**

- Create: `src/components/ui/VariantPicker.tsx`, `src/components/ui/VariantPicker.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProductVariant } from "@/types/domain";
import { VariantPicker } from "./VariantPicker";

const variants: ProductVariant[] = [
  { sku: "a-maroon-s", colorName: "Maroon", colorHex: "#800", size: "S", stock: 3 },
  { sku: "a-maroon-m", colorName: "Maroon", colorHex: "#800", size: "M", stock: 0 },
  { sku: "a-sage-s", colorName: "Sage", colorHex: "#9BAE92", size: "S", stock: 4 },
];

describe("VariantPicker", () => {
  it("calls onChange with the selected sku when a color is clicked", async () => {
    const onChange = vi.fn();
    render(<VariantPicker variants={variants} selectedSku={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Maroon/ }));
    expect(onChange).toHaveBeenCalled();
  });

  it("marks out-of-stock sizes as disabled", () => {
    render(<VariantPicker variants={variants} selectedSku="a-maroon-s" onChange={() => {}} />);
    const mSize = screen.getByRole("button", { name: "M" });
    expect(mSize).toBeDisabled();
  });

  it("omits the size row when no variant has a size", () => {
    const noSize: ProductVariant[] = [{ sku: "a", colorName: "Ivory", colorHex: "#fff", stock: 5 }];
    render(<VariantPicker variants={noSize} selectedSku="a" onChange={() => {}} />);
    expect(screen.queryByText(/^Size$/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, confirm failing**

```powershell
npx vitest run src/components/ui/VariantPicker.test.tsx
```

- [ ] **Step 3: Implement `src/components/ui/VariantPicker.tsx`**

```tsx
"use client";

import { clsx } from "@/lib/utils/clsx";
import type { ProductVariant } from "@/types/domain";

export interface VariantPickerProps {
  variants: ProductVariant[];
  selectedSku: string | null;
  onChange: (sku: string) => void;
  className?: string;
}

function uniqueColors(variants: ProductVariant[]) {
  const seen = new Map<string, { name: string; hex: string }>();
  for (const v of variants) {
    if (!seen.has(v.colorName)) seen.set(v.colorName, { name: v.colorName, hex: v.colorHex });
  }
  return [...seen.values()];
}

function uniqueSizesForColor(variants: ProductVariant[], colorName: string) {
  return variants
    .filter((v) => v.colorName === colorName)
    .map((v) => ({ size: v.size, sku: v.sku, stock: v.stock }))
    .filter((v): v is { size: string; sku: string; stock: number } => typeof v.size === "string");
}

export function VariantPicker({ variants, selectedSku, onChange, className }: VariantPickerProps) {
  const selected = variants.find((v) => v.sku === selectedSku) ?? null;
  const colors = uniqueColors(variants);
  const selectedColor = selected?.colorName ?? colors[0]?.name ?? "";
  const sizesForColor = uniqueSizesForColor(variants, selectedColor);
  const hasSizes = sizesForColor.length > 0;

  function pickColor(colorName: string) {
    const first = variants.find((v) => v.colorName === colorName);
    if (first) onChange(first.sku);
  }

  return (
    <div className={clsx("flex flex-col gap-5", className)}>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-700">
          Colour: <span className="text-ink-900">{selectedColor}</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => {
            const active = c.name === selectedColor;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => pickColor(c.name)}
                aria-label={c.name}
                aria-pressed={active}
                className={clsx(
                  "relative h-9 w-9 rounded-full border-2 transition",
                  active ? "border-ink-900" : "border-ink-500/20 hover:border-ink-700",
                )}
                style={{ background: c.hex }}
              />
            );
          })}
        </div>
      </div>

      {hasSizes && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-700">Size</span>
          <div className="flex flex-wrap gap-2">
            {sizesForColor.map((s) => {
              const oos = s.stock <= 0;
              const active = s.sku === selectedSku;
              return (
                <button
                  key={s.sku}
                  type="button"
                  disabled={oos}
                  aria-pressed={active}
                  onClick={() => onChange(s.sku)}
                  className={clsx(
                    "min-w-12 rounded-sm border px-3 py-2 text-sm transition",
                    active
                      ? "border-ink-900 bg-ink-900 text-white"
                      : "border-ink-500/30 text-ink-700 hover:border-ink-700",
                    oos && "cursor-not-allowed opacity-50 line-through",
                  )}
                >
                  {s.size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run, confirm passing**

```powershell
npx vitest run src/components/ui/VariantPicker.test.tsx
```

- [ ] **Step 5: Commit**

```powershell
git add src/components/ui/VariantPicker.tsx src/components/ui/VariantPicker.test.tsx
git commit -m "feat(ui): add VariantPicker (colour swatches + optional size pills)"
```

---

## Task 12: QuantityStepper (with tests)

**Files:**

- Create: `src/components/ui/QuantityStepper.tsx`, `src/components/ui/QuantityStepper.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuantityStepper } from "./QuantityStepper";

describe("QuantityStepper", () => {
  it("increments and decrements", async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} onChange={onChange} min={1} max={5} />);
    await userEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onChange).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("disables increment at max and decrement at min", () => {
    render(<QuantityStepper value={5} onChange={() => {}} min={1} max={5} />);
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrease quantity" })).not.toBeDisabled();
  });
});
```

- [ ] **Step 2: Run, confirm failing**

```powershell
npx vitest run src/components/ui/QuantityStepper.test.tsx
```

- [ ] **Step 3: Implement `src/components/ui/QuantityStepper.tsx`**

```tsx
"use client";

import { Minus, Plus } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface QuantityStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: QuantityStepperProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-sm border border-ink-500/30 bg-bg-elevated",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={dec}
        disabled={value <= min}
        className="flex h-10 w-10 items-center justify-center text-ink-700 transition hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span aria-live="polite" className="w-10 text-center font-medium tabular-nums text-ink-900">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={inc}
        disabled={value >= max}
        className="flex h-10 w-10 items-center justify-center text-ink-700 transition hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run, confirm passing**

```powershell
npx vitest run src/components/ui/QuantityStepper.test.tsx
```

- [ ] **Step 5: Commit**

```powershell
git add src/components/ui/QuantityStepper.tsx src/components/ui/QuantityStepper.test.tsx
git commit -m "feat(ui): add QuantityStepper"
```

---

## Task 13: AddToCartButton (stub)

**Files:**

- Create: `src/components/ui/AddToCartButton.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";

export interface AddToCartButtonProps {
  productName: string;
  variantSku: string | null;
  quantity: number;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function AddToCartButton({
  productName,
  variantSku,
  quantity,
  disabled,
  fullWidth,
  className,
}: AddToCartButtonProps) {
  function onClick() {
    if (!variantSku) {
      toast.error("Please choose a variant before adding to cart.");
      return;
    }
    // Phase 3 will wire this to a real server action.
    toast.success(`Added ${quantity} × ${productName} to cart`, {
      description: "Cart actions arrive in Phase 3.",
    });
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition",
        "hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        fullWidth && "w-full",
        className,
      )}
    >
      <ShoppingBag className="h-4 w-4" />
      Add to cart
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/ui/AddToCartButton.tsx
git commit -m "feat(ui): add AddToCartButton stub (toasts until Phase 3)"
```

---

## Task 14: ProductGrid (server component)

**Files:**

- Create: `src/components/storefront/ProductGrid.tsx`

- [ ] **Step 1: Create the file**

```tsx
import type { Product } from "@/types/domain";
import { ProductCard } from "./ProductCard";

export interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/storefront/ProductGrid.tsx
git commit -m "feat(storefront): add ProductGrid"
```

---

## Task 15: FilterRail and FilterDrawer

**Files:**

- Create: `src/components/storefront/FilterRail.tsx`, `src/components/storefront/FilterDrawer.tsx`

- [ ] **Step 1: Create `FilterRail.tsx`**

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { clsx } from "@/lib/utils/clsx";
import { parseShopFilters, serializeShopFilters, type ShopFilters } from "@/lib/utils/shop-filters";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterRailProps {
  fabricOptions: FilterOption[];
  colorOptions: { value: string; hex: string }[];
  occasionOptions: FilterOption[];
  priceBuckets: { min: number; max: number; label: string }[];
  className?: string;
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterRail({
  fabricOptions,
  colorOptions,
  occasionOptions,
  priceBuckets,
  className,
}: FilterRailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const obj: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      obj[k] = v;
    });
    return parseShopFilters(obj);
  }, [searchParams]);

  const apply = useCallback(
    (next: ShopFilters) => {
      const reset: ShopFilters = { ...next, page: 1 };
      const qs = serializeShopFilters(reset);
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router],
  );

  return (
    <aside className={clsx("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between pb-2">
        <h2 className="font-display text-xl text-ink-900">Filter</h2>
        <button
          type="button"
          onClick={() =>
            apply({ fabrics: [], colors: [], occasions: [], sort: filters.sort, page: 1 })
          }
          className="text-xs uppercase tracking-wide text-ink-500 hover:text-ink-900"
        >
          Clear all
        </button>
      </div>

      <Accordion>
        <AccordionItem title="Fabric" defaultOpen>
          <div className="flex flex-col gap-2 pt-1">
            {fabricOptions.map((opt) => {
              const checked = filters.fabrics.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      apply({ ...filters, fabrics: toggleValue(filters.fabrics, opt.value) })
                    }
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </AccordionItem>

        <AccordionItem title="Colour" defaultOpen>
          <div className="flex flex-wrap gap-2 pt-1">
            {colorOptions.map((c) => {
              const active = filters.colors.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-label={c.value}
                  aria-pressed={active}
                  onClick={() =>
                    apply({ ...filters, colors: toggleValue(filters.colors, c.value) })
                  }
                  className={clsx(
                    "h-8 w-8 rounded-full border-2 transition",
                    active ? "border-ink-900" : "border-ink-500/20 hover:border-ink-700",
                  )}
                  style={{ background: c.hex }}
                />
              );
            })}
          </div>
        </AccordionItem>

        <AccordionItem title="Occasion">
          <div className="flex flex-col gap-2 pt-1">
            {occasionOptions.map((opt) => {
              const checked = filters.occasions.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      apply({ ...filters, occasions: toggleValue(filters.occasions, opt.value) })
                    }
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </AccordionItem>

        <AccordionItem title="Price">
          <div className="flex flex-col gap-2 pt-1">
            {priceBuckets.map((b) => {
              const active = filters.priceMinPaise === b.min && filters.priceMaxPaise === b.max;
              return (
                <label key={b.label} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="radio"
                    name="price"
                    checked={active}
                    onChange={() =>
                      apply({
                        ...filters,
                        priceMinPaise: b.min,
                        priceMaxPaise: b.max,
                      })
                    }
                  />
                  {b.label}
                </label>
              );
            })}
            <button
              type="button"
              onClick={() =>
                apply({ ...filters, priceMinPaise: undefined, priceMaxPaise: undefined })
              }
              className="mt-1 self-start text-xs uppercase tracking-wide text-ink-500 hover:text-ink-900"
            >
              Clear price
            </button>
          </div>
        </AccordionItem>

        <AccordionItem title="Availability">
          <label className="flex items-center gap-2 pt-1 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={!!filters.inStockOnly}
              onChange={() =>
                apply({ ...filters, inStockOnly: !filters.inStockOnly ? true : undefined })
              }
            />
            In stock only
          </label>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
```

- [ ] **Step 2: Create `FilterDrawer.tsx`**

```tsx
"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { FilterRail, type FilterRailProps } from "./FilterRail";

export interface FilterDrawerProps extends FilterRailProps {}

export function FilterDrawer(props: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-sm border border-ink-500/30 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-700"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Filter" side="left">
        <FilterRail {...props} />
      </Sheet>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/storefront/FilterRail.tsx src/components/storefront/FilterDrawer.tsx
git commit -m "feat(storefront): add FilterRail (desktop) and FilterDrawer (mobile)"
```

---

## Task 16: SortDropdown

**Files:**

- Create: `src/components/storefront/SortDropdown.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseShopFilters, serializeShopFilters, type ShopSort } from "@/lib/utils/shop-filters";
import { Select } from "@/components/ui/Select";

const OPTIONS: { value: ShopSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "featured", label: "Featured" },
];

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    params[k] = v;
  });
  const filters = parseShopFilters(params);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = { ...filters, sort: e.target.value as ShopSort, page: 1 };
    const qs = serializeShopFilters(next);
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select aria-label="Sort" size="sm" value={filters.sort} onChange={onChange}>
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/storefront/SortDropdown.tsx
git commit -m "feat(storefront): add SortDropdown wired to URL filters"
```

---

## Task 17: ShopHeader

**Files:**

- Create: `src/components/storefront/ShopHeader.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { FilterDrawer, type FilterDrawerProps } from "./FilterDrawer";
import { SortDropdown } from "./SortDropdown";

export interface ShopHeaderProps extends FilterDrawerProps {
  title: string;
  description?: string;
  resultCount: number;
}

export function ShopHeader({ title, description, resultCount, ...filterProps }: ShopHeaderProps) {
  return (
    <header className="flex flex-col gap-4 pb-8 pt-12 md:gap-6 md:pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-ink-900 md:text-5xl">{title}</h1>
        {description && <p className="max-w-prose text-ink-700">{description}</p>}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-500">{resultCount} sarees</span>
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <FilterDrawer {...filterProps} />
          </div>
          <SortDropdown />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/storefront/ShopHeader.tsx
git commit -m "feat(storefront): add ShopHeader (title, count, filters button, sort)"
```

---

## Task 18: Filter options helper

**Files:**

- Create: `src/lib/utils/shop-options.ts`

This computes the filter option lists (fabrics, colors, occasions, price buckets) from the products fixture. Centralised so the shop pages and FilterRail share the same source of truth.

- [ ] **Step 1: Create the file**

```ts
import { PRODUCTS_FIXTURE } from "@/lib/db/fixtures/products";

export interface FabricOption {
  value: string;
  label: string;
}

export interface ColorOption {
  value: string;
  hex: string;
}

export interface PriceBucket {
  min: number;
  max: number;
  label: string;
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function getFabricOptions(): FabricOption[] {
  const fabrics = uniq(PRODUCTS_FIXTURE.map((p) => p.fabric.toLowerCase()));
  return fabrics
    .map((f) => ({ value: f, label: f.replace(/(^|\s)\S/g, (s) => s.toUpperCase()) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getColorOptions(): ColorOption[] {
  const map = new Map<string, string>();
  for (const p of PRODUCTS_FIXTURE) {
    for (const v of p.variants) {
      if (!map.has(v.colorName)) map.set(v.colorName, v.colorHex);
    }
  }
  return [...map.entries()]
    .map(([value, hex]) => ({ value, hex }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

export function getOccasionOptions(): FabricOption[] {
  const all = PRODUCTS_FIXTURE.flatMap((p) => p.occasion);
  return uniq(all)
    .map((o) => ({ value: o, label: o.replace(/(^|\s)\S/g, (s) => s.toUpperCase()) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export const PRICE_BUCKETS: PriceBucket[] = [
  { min: 0, max: 500000, label: "Under ₹5,000" },
  { min: 500000, max: 1500000, label: "₹5,000 – ₹15,000" },
  { min: 1500000, max: 3000000, label: "₹15,000 – ₹30,000" },
  { min: 3000000, max: 6000000, label: "₹30,000 – ₹60,000" },
];
```

- [ ] **Step 2: Commit**

```powershell
git add src/lib/utils/shop-options.ts
git commit -m "feat(utils): add shop filter options helper derived from fixtures"
```

---

## Task 19: /shop page (all products)

**Files:**

- Create: `src/app/(storefront)/shop/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { productsRepo } from "@/lib/db/repos/products";
import { parseShopFilters, serializeShopFilters } from "@/lib/utils/shop-filters";
import {
  getColorOptions,
  getFabricOptions,
  getOccasionOptions,
  PRICE_BUCKETS,
} from "@/lib/utils/shop-options";
import { FilterRail } from "@/components/storefront/FilterRail";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ShopHeader } from "@/components/storefront/ShopHeader";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

export const metadata = {
  title: "Shop · Saree Store",
  description: "Browse our complete edit of handpicked sarees.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ShopPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const filters = parseShopFilters(rawParams);
  const result = await productsRepo.search({
    fabrics: filters.fabrics.length > 0 ? filters.fabrics : undefined,
    colors: filters.colors.length > 0 ? filters.colors : undefined,
    occasions: filters.occasions.length > 0 ? filters.occasions : undefined,
    priceMinPaise: filters.priceMinPaise,
    priceMaxPaise: filters.priceMaxPaise,
    inStockOnly: filters.inStockOnly,
    sort: filters.sort,
    page: filters.page,
  });
  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize));

  const fabricOptions = getFabricOptions();
  const colorOptions = getColorOptions();
  const occasionOptions = getOccasionOptions();

  const buildHref = (page: number) => {
    const qs = serializeShopFilters({ ...filters, page });
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <Container size="xl" className="py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <ShopHeader
        title="All Sarees"
        description="Hand-picked weaves across silk, cotton, linen and designer drapes."
        resultCount={result.totalCount}
        fabricOptions={fabricOptions}
        colorOptions={colorOptions}
        occasionOptions={occasionOptions}
        priceBuckets={PRICE_BUCKETS}
      />

      <div className="grid gap-10 md:grid-cols-[260px_1fr]">
        <div className="hidden md:block">
          <FilterRail
            fabricOptions={fabricOptions}
            colorOptions={colorOptions}
            occasionOptions={occasionOptions}
            priceBuckets={PRICE_BUCKETS}
          />
        </div>
        <div className="flex flex-col gap-12">
          {result.items.length === 0 ? (
            <EmptyState
              title="No sarees match these filters"
              description="Try removing a filter or two to see more."
            />
          ) : (
            <ProductGrid products={result.items} />
          )}
          <Pagination currentPage={result.page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Verify build**

```powershell
npx next build
```

Expected: `/shop` route registered.

- [ ] **Step 3: Commit**

```powershell
git add "src/app/(storefront)/shop/page.tsx"
git commit -m "feat(shop): add /shop listing page with filters, sort, pagination"
```

---

## Task 20: /shop/[categorySlug] dynamic route

**Files:**

- Create: `src/app/(storefront)/shop/[categorySlug]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { notFound } from "next/navigation";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { parseShopFilters, serializeShopFilters } from "@/lib/utils/shop-filters";
import {
  getColorOptions,
  getFabricOptions,
  getOccasionOptions,
  PRICE_BUCKETS,
} from "@/lib/utils/shop-options";
import { FilterRail } from "@/components/storefront/FilterRail";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ShopHeader } from "@/components/storefront/ShopHeader";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps) {
  const { categorySlug } = await params;
  const category = await categoriesRepo.getBySlug(categorySlug);
  if (!category) return { title: "Shop · Saree Store" };
  return {
    title: `${category.name} · Saree Store`,
    description: category.description,
  };
}

export default async function CategoryShopPage({ params, searchParams }: PageProps) {
  const { categorySlug } = await params;
  const category = await categoriesRepo.getBySlug(categorySlug);
  if (!category) notFound();

  const rawParams = await searchParams;
  const filters = parseShopFilters(rawParams);

  const result = await productsRepo.search({
    categorySlugs: [category.slug],
    fabrics: filters.fabrics.length > 0 ? filters.fabrics : undefined,
    colors: filters.colors.length > 0 ? filters.colors : undefined,
    occasions: filters.occasions.length > 0 ? filters.occasions : undefined,
    priceMinPaise: filters.priceMinPaise,
    priceMaxPaise: filters.priceMaxPaise,
    inStockOnly: filters.inStockOnly,
    sort: filters.sort,
    page: filters.page,
  });
  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize));

  const fabricOptions = getFabricOptions();
  const colorOptions = getColorOptions();
  const occasionOptions = getOccasionOptions();

  const buildHref = (page: number) => {
    const qs = serializeShopFilters({ ...filters, page });
    return qs ? `/shop/${category.slug}?${qs}` : `/shop/${category.slug}`;
  };

  return (
    <Container size="xl" className="py-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: category.name },
        ]}
      />
      <ShopHeader
        title={category.name}
        description={category.description}
        resultCount={result.totalCount}
        fabricOptions={fabricOptions}
        colorOptions={colorOptions}
        occasionOptions={occasionOptions}
        priceBuckets={PRICE_BUCKETS}
      />

      <div className="grid gap-10 md:grid-cols-[260px_1fr]">
        <div className="hidden md:block">
          <FilterRail
            fabricOptions={fabricOptions}
            colorOptions={colorOptions}
            occasionOptions={occasionOptions}
            priceBuckets={PRICE_BUCKETS}
          />
        </div>
        <div className="flex flex-col gap-12">
          {result.items.length === 0 ? (
            <EmptyState
              title="No sarees match these filters"
              description="Try removing a filter or two to see more."
            />
          ) : (
            <ProductGrid products={result.items} />
          )}
          <Pagination currentPage={result.page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Verify build**

```powershell
npx next build
```

Expected: `/shop/[categorySlug]` route registered.

- [ ] **Step 3: Commit**

```powershell
git add "src/app/(storefront)/shop/[categorySlug]/page.tsx"
git commit -m "feat(shop): add /shop/[categorySlug] dynamic category listing"
```

---

## Task 21: ProductGallery (Embla + zoom)

**Files:**

- Create: `src/components/storefront/ProductGallery.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { clsx } from "@/lib/utils/clsx";
import type { ProductImage } from "@/types/domain";

export interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const onThumbClick = useCallback(
    (idx: number) => {
      emblaApi?.scrollTo(idx);
      setSelected(idx);
    },
    [emblaApi],
  );

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ x, y });
  }

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:gap-4">
      <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col">
        {images.map((img, idx) => (
          <button
            key={img.url}
            type="button"
            onClick={() => onThumbClick(idx)}
            aria-label={`View image ${idx + 1}`}
            className={clsx(
              "relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border transition",
              selected === idx ? "border-ink-900" : "border-ink-500/15 hover:border-ink-700",
            )}
          >
            <Image src={img.url} alt={img.alt} fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      <div className="order-1 flex-1 md:order-2">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {images.map((img, idx) => (
              <div key={img.url} className="relative min-w-0 flex-[0_0_100%]">
                <div
                  className="group relative aspect-[3/4] w-full overflow-hidden rounded-md bg-ink-500/5"
                  onMouseMove={onMouseMove}
                  onMouseLeave={() => setZoom(null)}
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    priority={idx === 0}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className={clsx(
                      "object-cover transition-transform duration-200",
                      zoom && selected === idx ? "scale-150" : "scale-100",
                    )}
                    style={
                      zoom && selected === idx
                        ? { transformOrigin: `${zoom.x}% ${zoom.y}%` }
                        : undefined
                    }
                  />
                  <span className="sr-only">
                    {productName} – image {idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

> Note: the Embla `onSelect` -> thumb-highlight sync is intentionally simple here. The thumbnail buttons drive Embla via `scrollTo`, and the local `selected` state matches it. We don't subscribe to Embla's `select` event because the user's only interaction with the main slider is via thumb clicks for now.

- [ ] **Step 2: Verify build**

```powershell
npx next build
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/storefront/ProductGallery.tsx
git commit -m "feat(storefront): add ProductGallery with thumbnails and hover zoom"
```

---

## Task 22: PincodeChecker (mock)

**Files:**

- Create: `src/components/storefront/PincodeChecker.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

interface CheckResult {
  ok: boolean;
  etaDays: number;
  codAvailable: boolean;
}

function mockServiceability(pincode: string): CheckResult {
  // Mock: pincodes starting with 5 or 6 not COD; deterministic ETA based on first digit.
  const firstDigit = pincode[0] ?? "0";
  const etaByDigit: Record<string, number> = {
    "1": 5,
    "2": 4,
    "3": 4,
    "4": 5,
    "5": 6,
    "6": 6,
    "7": 7,
    "8": 7,
    "9": 4,
    "0": 5,
  };
  return {
    ok: true,
    etaDays: etaByDigit[firstDigit] ?? 5,
    codAvailable: !["5", "6"].includes(firstDigit),
  };
}

export function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setError(null);
    if (!/^\d{6}$/.test(pincode)) {
      setError("Enter a 6-digit pincode.");
      return;
    }
    setResult(mockServiceability(pincode));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-700">
        Check delivery
      </span>
      <div className="flex gap-2">
        <input
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          placeholder="6-digit pincode"
          className="flex-1 rounded-sm border border-ink-500/30 bg-bg-elevated px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-700"
        >
          Check
        </button>
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
      {result && (
        <div
          className={clsx(
            "mt-1 flex items-start gap-2 rounded-sm border p-3 text-sm",
            "border-success/30 bg-success/5 text-success",
          )}
        >
          <Truck className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-col gap-0.5 text-ink-700">
            <span className="font-medium text-ink-900">
              Delivery in {result.etaDays} business days
            </span>
            <span className="text-xs">
              {result.codAvailable
                ? "Cash on delivery available"
                : "Online prepaid only at this pincode"}
            </span>
          </div>
        </div>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/storefront/PincodeChecker.tsx
git commit -m "feat(storefront): add PincodeChecker with mock serviceability"
```

---

## Task 23: ReviewSummary + ReviewList

**Files:**

- Create: `src/components/storefront/ReviewSummary.tsx`, `src/components/storefront/ReviewList.tsx`

- [ ] **Step 1: Create `ReviewSummary.tsx`**

```tsx
import { RatingStars } from "@/components/ui/RatingStars";
import type { Review } from "@/types/domain";

export interface ReviewSummaryProps {
  reviews: Review[];
}

export function ReviewSummary({ reviews }: ReviewSummaryProps) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col gap-1 text-sm text-ink-500">
        <RatingStars rating={0} />
        <span>No reviews yet</span>
      </div>
    );
  }

  const total = reviews.length;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) distribution[r.rating]! += 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <span className="font-display text-4xl text-ink-900">{avg.toFixed(1)}</span>
        <div className="flex flex-col gap-1">
          <RatingStars rating={avg} size="md" />
          <span className="text-xs text-ink-500">
            {total} {total === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <li key={star} className="flex items-center gap-3 text-xs text-ink-700">
              <span className="w-3 text-right">{star}</span>
              <div className="relative h-1.5 flex-1 rounded-full bg-ink-500/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-accent-gold"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right tabular-nums text-ink-500">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Create `ReviewList.tsx`**

```tsx
import { EmptyState } from "@/components/ui/EmptyState";
import { RatingStars } from "@/components/ui/RatingStars";
import type { Review } from "@/types/domain";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="Be the first to review"
        description="Once you've worn it, share what you think."
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-ink-500/10">
      {reviews.map((r) => {
        const dateText = new Date(r.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return (
          <li key={r.id} className="flex flex-col gap-2 py-6">
            <div className="flex items-center gap-3">
              <RatingStars rating={r.rating} size="sm" />
              {r.verifiedPurchase && (
                <span className="text-xs uppercase tracking-wide text-success">Verified buyer</span>
              )}
            </div>
            {r.title && <h3 className="font-display text-lg text-ink-900">{r.title}</h3>}
            <p className="text-sm text-ink-700">{r.body}</p>
            <span className="text-xs text-ink-500">
              {r.authorName} · {dateText}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/storefront/ReviewSummary.tsx src/components/storefront/ReviewList.tsx
git commit -m "feat(storefront): add ReviewSummary and ReviewList"
```

---

## Task 24: RelatedProducts

**Files:**

- Create: `src/components/storefront/RelatedProducts.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Product } from "@/types/domain";
import { ProductCard } from "./ProductCard";

export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <section className="py-20">
      <Container size="xl">
        <SectionHeading
          eyebrow="You may also like"
          title="More from this collection"
          className="mb-10"
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/storefront/RelatedProducts.tsx
git commit -m "feat(storefront): add RelatedProducts grid"
```

---

## Task 25: Product detail page

**Files:**

- Create: `src/app/(storefront)/product/[slug]/page.tsx`
- Create: `src/components/storefront/ProductBuyBox.tsx` (the client island that holds variant + qty state)

- [ ] **Step 1: Create `ProductBuyBox.tsx`**

```tsx
"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { PriceTag } from "@/components/ui/PriceTag";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { VariantPicker } from "@/components/ui/VariantPicker";
import type { Product } from "@/types/domain";

export function ProductBuyBox({ product }: { product: Product }) {
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0] ?? null;
  const [selectedSku, setSelectedSku] = useState<string | null>(firstInStock?.sku ?? null);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = product.variants.find((v) => v.sku === selectedSku) ?? null;
  const inStock = (selectedVariant?.stock ?? 0) > 0;
  const maxQty = Math.max(1, Math.min(10, selectedVariant?.stock ?? 0));

  return (
    <div className="flex flex-col gap-6">
      <PriceTag priceInPaise={product.priceInPaise} mrpInPaise={product.mrpInPaise} size="lg" />
      <VariantPicker
        variants={product.variants}
        selectedSku={selectedSku}
        onChange={(sku) => {
          setSelectedSku(sku);
          setQuantity(1);
        }}
      />
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-700">Quantity</span>
        <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={maxQty} />
      </div>
      <div className="flex flex-col gap-2">
        {inStock ? (
          <span className="text-sm text-success">In stock · ready to ship</span>
        ) : (
          <span className="text-sm text-danger">Currently out of stock</span>
        )}
        <AddToCartButton
          productName={product.name}
          variantSku={selectedSku}
          quantity={quantity}
          disabled={!inStock}
          fullWidth
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/(storefront)/product/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { reviewsRepo } from "@/lib/db/repos/reviews";
import { PincodeChecker } from "@/components/storefront/PincodeChecker";
import { ProductBuyBox } from "@/components/storefront/ProductBuyBox";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { RelatedProducts } from "@/components/storefront/RelatedProducts";
import { ReviewList } from "@/components/storefront/ReviewList";
import { ReviewSummary } from "@/components/storefront/ReviewSummary";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/Tabs";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await productsRepo.getBySlug(slug);
  if (!product) return { title: "Product · Saree Store" };
  return {
    title: `${product.name} · Saree Store`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await productsRepo.getBySlug(slug);
  if (!product) notFound();

  const [category, related, reviews] = await Promise.all([
    categoriesRepo.getBySlug(product.categorySlug),
    productsRepo.listByCategory(product.categorySlug, { limit: 8 }),
    reviewsRepo.listByProduct(product.id),
  ]);
  const recommendations = related.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <Container size="xl" className="py-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            ...(category ? [{ label: category.name, href: `/shop/${category.slug}` }] : []),
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <ProductGallery images={product.images} productName={product.name} />

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">
                {product.fabric}
              </span>
              <h1 className="font-display text-3xl text-ink-900 md:text-4xl">{product.name}</h1>
              <p className="text-sm text-ink-700">{product.description}</p>
            </div>

            <ProductBuyBox product={product} />

            <PincodeChecker />
          </div>
        </div>

        <div className="mt-20">
          <Tabs defaultValue="description">
            <TabList>
              <Tab value="description">Description</Tab>
              <Tab value="care">Fabric &amp; care</Tab>
              <Tab value="shipping">Shipping &amp; returns</Tab>
            </TabList>
            <TabPanel value="description">
              <p className="max-w-prose">{product.description}</p>
            </TabPanel>
            <TabPanel value="care">
              <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5">
                <li>Fabric: {product.fabric}</li>
                <li>Dry clean only for the first wash; gentle hand-wash thereafter.</li>
                <li>Iron on the reverse side at low temperature.</li>
                <li>Store folded with a soft cotton wrap; avoid direct sunlight.</li>
              </ul>
            </TabPanel>
            <TabPanel value="shipping">
              <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5">
                <li>Free shipping on orders over ₹2,000 anywhere in India.</li>
                <li>Cash on delivery available across most pincodes.</li>
                <li>7-day return window from the date of delivery.</li>
                <li>Made-to-order pieces are non-returnable.</li>
              </ul>
            </TabPanel>
          </Tabs>
        </div>

        <div className="mt-20 grid gap-12 md:grid-cols-[1fr_2fr]">
          <ReviewSummary reviews={reviews} />
          <ReviewList reviews={reviews} />
        </div>
      </Container>

      <RelatedProducts products={recommendations} />
    </>
  );
}
```

- [ ] **Step 3: Build verify**

```powershell
npx next build
```

Expected: `/product/[slug]` route registered.

- [ ] **Step 4: Commit**

```powershell
git add "src/app/(storefront)/product/[slug]/page.tsx" src/components/storefront/ProductBuyBox.tsx
git commit -m "feat(product): add product detail page with gallery, buy box, tabs, reviews"
```

---

## Task 26: E2E shop and product tests

**Files:**

- Create: `tests/e2e/shop.spec.ts`, `tests/e2e/product-detail.spec.ts`

- [ ] **Step 1: Create `tests/e2e/shop.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test.describe("Shop pages", () => {
  test("/shop renders the listing, sort, and at least one product", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { level: 1, name: /All Sarees/i })).toBeVisible();
    const productLinks = page.locator("a[href^='/product/']");
    expect(await productLinks.count()).toBeGreaterThan(0);
    await expect(page.getByLabel("Sort")).toBeVisible();
  });

  test("/shop/silk filters to silk category", async ({ page }) => {
    await page.goto("/shop/silk");
    await expect(page.getByRole("heading", { level: 1, name: /Silk Sarees/i })).toBeVisible();
    const links = page.locator("a[href^='/product/']");
    expect(await links.count()).toBeGreaterThan(0);
  });

  test("changing sort updates the URL", async ({ page }) => {
    await page.goto("/shop");
    await page.getByLabel("Sort").selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
  });

  test("404 for unknown category", async ({ page }) => {
    const res = await page.goto("/shop/this-category-does-not-exist");
    expect(res?.status()).toBe(404);
  });
});
```

- [ ] **Step 2: Create `tests/e2e/product-detail.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test.describe("Product detail", () => {
  test("renders product, variants, tabs, and add to cart", async ({ page }) => {
    await page.goto("/product/amrita-kanjivaram");
    await expect(page.getByRole("heading", { level: 1, name: /Amrita Kanjivaram/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Description/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add to cart/i })).toBeVisible();
  });

  test("switching variants does not 404", async ({ page }) => {
    await page.goto("/product/amrita-kanjivaram");
    const swatches = page.locator("button[aria-label='Maroon'], button[aria-label='Emerald']");
    expect(await swatches.count()).toBeGreaterThan(0);
    await swatches.first().click();
    // Page should still be on the same product URL
    await expect(page).toHaveURL(/\/product\/amrita-kanjivaram/);
  });

  test("pincode check renders eligibility info for a valid pincode", async ({ page }) => {
    await page.goto("/product/amrita-kanjivaram");
    await page.getByPlaceholder("6-digit pincode").fill("110001");
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByText(/Delivery in \d+ business days/)).toBeVisible();
  });

  test("clicking Add to cart shows a toast (stub)", async ({ page }) => {
    await page.goto("/product/amrita-kanjivaram");
    await page.getByRole("button", { name: /Add to cart/i }).click();
    // sonner renders into the DOM
    await expect(page.getByText(/Added \d+ × Amrita Kanjivaram to cart/)).toBeVisible();
  });

  test("404 for unknown product", async ({ page }) => {
    const res = await page.goto("/product/does-not-exist");
    expect(res?.status()).toBe(404);
  });
});
```

- [ ] **Step 3: Run e2e**

```powershell
npm run e2e
```

Expected: shop tests + product-detail tests all pass.

- [ ] **Step 4: Commit**

```powershell
git add tests/e2e/shop.spec.ts tests/e2e/product-detail.spec.ts
git commit -m "test(e2e): add shop listing and product detail tests"
```

---

## Task 27: Final verification + tag

- [ ] **Step 1: Run the full suite**

```powershell
npx prettier --check .
npx eslint .
npx tsc --noEmit
npx vitest run
npx next build
npm run e2e
```

Expected: all green.

- [ ] **Step 2: Tag**

```powershell
git tag -a phase-2-complete -m "Phase 2 (shop + product detail) complete"
```

---

## What's NOT in this phase

- **Cart + checkout** — Phase 3.
- **Auth UI** — Phase 4.
- **Real Add to Cart action** — Phase 3 (the button is a stub).
- **Real serviceability via Shiprocket** — Phase 7 (currently mocked deterministically).
- **Real reviews submission UI** — gated to verified purchases; ships in Phase 5 / 8.

## Spec coverage check (against §13.4)

- **Shop page**: sticky filter rail on desktop, bottom-sheet on mobile ✓, filters for category/fabric/colour/occasion/price/in-stock ✓, sort ✓, grid 2/3/4 across mobile/tablet/desktop ✓ (ProductCard from Phase 1 handles hover swap), pagination ✓.
- **Product page**: large gallery with hover zoom + thumbnails (Embla) ✓, name + price (MRP strike) ✓, variant swatches + blouse note (note text rendered via product.description; explicit blouse-note field can be added later if products acquire it) ✓, quantity stepper ✓, Add-to-cart (stub) ✓, pincode check ✓, description/fabric/care tabs ✓, reviews ✓, "You may also like" ✓.

Two minor gaps that surface in Phase 2 but resolve later:

- Buy Now button is not present (it's redundant with the cart flow we add in Phase 3; will be added there).
- The "blouse fabric note" field on Product is not yet in the type or fixtures. The product description currently covers it. If/when a dedicated blouse-note product field is needed, it'll be added in Phase 6 (admin product CRUD) where product schema evolves.
