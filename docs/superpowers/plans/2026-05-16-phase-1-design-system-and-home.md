# Phase 1 — Design System + Mock Repositories + Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the home page with realistic mock data, behind the same Server-Component-calls-repo pattern we'll use when DynamoDB is wired in Phase 8. Establish the design system primitives that every later UI phase will reuse.

**Architecture:** Mock repositories live at `src/lib/db/repos/*.ts` — the same path real DynamoDB repositories will eventually occupy. Each repo exports an async interface; the Phase 1 implementation reads from in-memory TypeScript fixtures at `src/lib/db/fixtures/`. Server Components and Server Actions consume the repo interface, so swapping the implementation to DynamoDB later is a one-file change per entity. Storefront UI is composed of three layers: shared primitives in `components/ui/`, marketing-page sections in `components/storefront/`, and the home page in `app/(storefront)/page.tsx`.

**Tech Stack:** Next.js 16 (App Router, RSC, Server Components by default), React 19, TypeScript (strict + `noUncheckedIndexedAccess`), Tailwind v4 (Phase 0 tokens), MUI v9 (themed in Phase 0), Framer Motion (entry animations), Embla Carousel (hero, reviews), `next/image` with Unsplash placeholder photography.

**Reference spec:** `docs/superpowers/specs/2026-05-16-saree-ecom-design.md` (§5 data model, §13 UI design system).

---

## File Map

```
✚ src/types/domain.ts                                  # Product, Category, Banner, Review, Variant types
✚ src/lib/money.ts                                     # paise → ₹ formatter
✚ src/lib/money.test.ts
✚ src/lib/db/fixtures/products.ts                      # 12 saree products
✚ src/lib/db/fixtures/categories.ts                    # 6 categories
✚ src/lib/db/fixtures/banners.ts                       # 4 banners
✚ src/lib/db/fixtures/reviews.ts                       # 6 reviews
✚ src/lib/db/repos/products.ts                         # productsRepo + mock impl
✚ src/lib/db/repos/products.test.ts
✚ src/lib/db/repos/categories.ts                       # categoriesRepo + mock impl
✚ src/lib/db/repos/categories.test.ts
✚ src/lib/db/repos/banners.ts                          # bannersRepo + mock impl
✚ src/lib/db/repos/banners.test.ts
✚ src/lib/db/repos/reviews.ts                          # reviewsRepo + mock impl
✚ src/lib/db/repos/reviews.test.ts
✎ next.config.ts                                       # add remotePatterns for Unsplash
✚ src/components/ui/Badge.tsx
✚ src/components/ui/Chip.tsx
✚ src/components/ui/PriceTag.tsx
✚ src/components/ui/PriceTag.test.tsx
✚ src/components/ui/IconButton.tsx
✚ src/components/ui/Skeleton.tsx
✚ src/components/ui/EmptyState.tsx
✚ src/components/ui/Container.tsx
✚ src/components/ui/SectionHeading.tsx
✚ src/components/shared/AnnouncementBar.tsx
✚ src/components/shared/Header.tsx
✚ src/components/shared/Footer.tsx
✚ src/components/shared/MarketingShell.tsx
✚ src/app/(storefront)/layout.tsx                      # wraps storefront in MarketingShell
✚ src/components/storefront/ProductCard.tsx
✚ src/components/storefront/CategoryTile.tsx
✚ src/components/storefront/BannerHero.tsx             # client component, Embla
✚ src/components/storefront/CollectionRail.tsx         # client component, scroll-snap
✚ src/components/storefront/ReviewCarousel.tsx         # client component, Embla
✚ src/components/storefront/StorytellerSection.tsx
✚ src/components/storefront/InstagramStrip.tsx
✎ src/app/(storefront)/page.tsx                        # compose the full home page
✚ src/app/dev/ui/page.tsx                              # primitive showcase
✚ tests/e2e/home.spec.ts                               # visual smoke
```

Conventions:

- Server Components by default. Add `"use client"` only where state, refs, or browser APIs are needed (carousels and a few interactive primitives).
- All money in code is integer **paise**. Display via `formatRupees()`.
- Image URLs in fixtures are stable Unsplash photo URLs (CC0 licensed for use).
- Repo interfaces are async even when backing data is in-memory, so swapping to DynamoDB later is signature-compatible.

---

## Task 1: Domain Types

**Files:**

- Create: `src/types/domain.ts`

- [ ] **Step 1: Create src/types/domain.ts**

```ts
export type ProductStatus = "draft" | "active" | "archived";

export interface ProductVariant {
  sku: string;
  colorName: string;
  colorHex: string;
  size?: string;
  stock: number;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  priceInPaise: number;
  mrpInPaise: number;
  images: ProductImage[];
  variants: ProductVariant[];
  tags: string[];
  fabric: string;
  occasion: string[];
  status: ProductStatus;
  featured: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  parentSlug: string | null;
  sortOrder: number;
}

export type BannerPlacement = "home-hero" | "home-strip" | "shop-strip";

export interface Banner {
  id: string;
  placement: BannerPlacement;
  imageUrl: string;
  imageAlt: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  sortOrder: number;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string | null;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  body: string;
  createdAt: string;
  verifiedPurchase: boolean;
}
```

- [ ] **Step 2: Verify typecheck**

```powershell
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```powershell
git add src/types/domain.ts
git commit -m "feat(types): add domain types for products, categories, banners, reviews"
```

---

## Task 2: Money Formatter (paise → ₹)

**Files:**

- Create: `src/lib/money.ts`, `src/lib/money.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/money.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatRupees, paiseToRupees, rupeesToPaise } from "./money";

describe("money", () => {
  it("converts paise to rupees as number", () => {
    expect(paiseToRupees(125000)).toBe(1250);
    expect(paiseToRupees(99)).toBe(0.99);
  });

  it("converts rupees to paise as integer", () => {
    expect(rupeesToPaise(1250)).toBe(125000);
    expect(rupeesToPaise(0.99)).toBe(99);
  });

  it("formats paise as Indian rupees with the ₹ symbol and grouping", () => {
    expect(formatRupees(125000)).toBe("₹1,250");
    expect(formatRupees(2500000)).toBe("₹25,000");
    expect(formatRupees(10000000)).toBe("₹1,00,000");
  });

  it("hides paise when the amount is a whole rupee", () => {
    expect(formatRupees(50000)).toBe("₹500");
  });

  it("shows two decimals when paise are non-zero", () => {
    expect(formatRupees(50050)).toBe("₹500.50");
  });
});
```

- [ ] **Step 2: Run the failing test**

```powershell
npx vitest run src/lib/money.test.ts
```

Expected: 5 failing (module not found).

- [ ] **Step 3: Implement src/lib/money.ts**

```ts
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

const inrFormatterWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrFormatterDecimal = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatRupees(paise: number): string {
  const rupees = paiseToRupees(paise);
  const isWhole = Number.isInteger(rupees);
  const formatter = isWhole ? inrFormatterWhole : inrFormatterDecimal;
  // Strip any non-breaking space some ICU builds insert between the symbol and digits.
  return formatter.format(rupees).replace(/\s/g, "");
}
```

- [ ] **Step 4: Run test, confirm pass**

```powershell
npx vitest run src/lib/money.test.ts
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/money.ts src/lib/money.test.ts
git commit -m "feat(money): add paise/rupees converters and INR formatter"
```

---

## Task 3: Configure Next.js Remote Image Patterns

**Files:**

- Modify: `next.config.ts`

- [ ] **Step 1: Replace next.config.ts**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify build**

```powershell
npx next build
```

Expected: succeeds with the same routes as before; no warnings about `images.remotePatterns`.

- [ ] **Step 3: Commit**

```powershell
git add next.config.ts
git commit -m "chore(images): allow Unsplash remote images and prefer AVIF/WebP"
```

---

## Task 4: Categories Fixture

**Files:**

- Create: `src/lib/db/fixtures/categories.ts`

- [ ] **Step 1: Create src/lib/db/fixtures/categories.ts**

```ts
import type { Category } from "@/types/domain";

export const CATEGORIES_FIXTURE: Category[] = [
  {
    id: "cat_silk",
    slug: "silk",
    name: "Silk Sarees",
    description: "Hand-woven silk drapes for weddings and milestones.",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    parentSlug: null,
    sortOrder: 1,
  },
  {
    id: "cat_cotton",
    slug: "cotton",
    name: "Cotton Sarees",
    description: "Breathable everyday weaves from across India.",
    imageUrl:
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80",
    parentSlug: null,
    sortOrder: 2,
  },
  {
    id: "cat_banarasi",
    slug: "banarasi",
    name: "Banarasi",
    description: "Heritage Banarasi brocade from the looms of Varanasi.",
    imageUrl:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",
    parentSlug: "silk",
    sortOrder: 3,
  },
  {
    id: "cat_kanjivaram",
    slug: "kanjivaram",
    name: "Kanjivaram",
    description: "Temple-bordered pure-silk Kanjivarams from Tamil Nadu.",
    imageUrl:
      "https://images.unsplash.com/photo-1583391733981-86d0d2c0e9aa?auto=format&fit=crop&w=1200&q=80",
    parentSlug: "silk",
    sortOrder: 4,
  },
  {
    id: "cat_linen",
    slug: "linen",
    name: "Linen",
    description: "Crisp linen drapes for warm-weather wear.",
    imageUrl:
      "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=1200&q=80",
    parentSlug: null,
    sortOrder: 5,
  },
  {
    id: "cat_designer",
    slug: "designer",
    name: "Designer Edit",
    description: "Modern silhouettes from emerging Indian designers.",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469973-e1b80fb95e36?auto=format&fit=crop&w=1200&q=80",
    parentSlug: null,
    sortOrder: 6,
  },
];
```

- [ ] **Step 2: Verify typecheck**

```powershell
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/db/fixtures/categories.ts
git commit -m "feat(fixtures): add 6 saree category fixtures"
```

---

## Task 5: Products Fixture

**Files:**

- Create: `src/lib/db/fixtures/products.ts`

This fixture has 12 sarees across the categories. Realistic Indian names and prices.

- [ ] **Step 1: Create src/lib/db/fixtures/products.ts**

```ts
import type { Product } from "@/types/domain";

const baseImages = {
  ivory:
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
  ivoryAlt:
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80",
  maroon:
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",
  maroonAlt:
    "https://images.unsplash.com/photo-1583391733981-86d0d2c0e9aa?auto=format&fit=crop&w=1200&q=80",
  green:
    "https://images.unsplash.com/photo-1610030469973-e1b80fb95e36?auto=format&fit=crop&w=1200&q=80",
  greenAlt:
    "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=1200&q=80",
};

export const PRODUCTS_FIXTURE: Product[] = [
  {
    id: "prd_amrita",
    slug: "amrita-kanjivaram",
    name: "Amrita Kanjivaram",
    description:
      "Pure mulberry silk Kanjivaram in deep maroon with antique zari temple border. Handwoven in Kanchipuram.",
    categorySlug: "kanjivaram",
    priceInPaise: 4250000,
    mrpInPaise: 4800000,
    images: [
      { url: baseImages.maroon, alt: "Amrita Kanjivaram saree front" },
      { url: baseImages.maroonAlt, alt: "Amrita Kanjivaram pallu detail" },
    ],
    variants: [
      { sku: "amrita-maroon", colorName: "Maroon", colorHex: "#8E2A2A", stock: 4 },
      { sku: "amrita-emerald", colorName: "Emerald", colorHex: "#1E5945", stock: 2 },
    ],
    tags: ["wedding", "kanjivaram", "silk", "heritage"],
    fabric: "Pure mulberry silk",
    occasion: ["wedding", "festive"],
    status: "active",
    featured: true,
    createdAt: "2026-04-22T10:00:00Z",
  },
  {
    id: "prd_meera",
    slug: "meera-banarasi",
    name: "Meera Banarasi",
    description: "Ivory tissue Banarasi with gold buti work across the body and a meenakari pallu.",
    categorySlug: "banarasi",
    priceInPaise: 3200000,
    mrpInPaise: 3600000,
    images: [
      { url: baseImages.ivory, alt: "Meera Banarasi front" },
      { url: baseImages.ivoryAlt, alt: "Meera Banarasi pallu" },
    ],
    variants: [
      { sku: "meera-ivory", colorName: "Ivory", colorHex: "#F3EBD8", stock: 6 },
      { sku: "meera-blush", colorName: "Blush", colorHex: "#E5B6B6", stock: 3 },
    ],
    tags: ["wedding", "banarasi", "tissue"],
    fabric: "Tissue silk",
    occasion: ["wedding", "festive"],
    status: "active",
    featured: true,
    createdAt: "2026-04-20T10:00:00Z",
  },
  {
    id: "prd_kavya",
    slug: "kavya-linen",
    name: "Kavya Linen",
    description: "Featherlight pure linen saree in sage with hand-block prints along the border.",
    categorySlug: "linen",
    priceInPaise: 480000,
    mrpInPaise: 620000,
    images: [
      { url: baseImages.green, alt: "Kavya linen front" },
      { url: baseImages.greenAlt, alt: "Kavya linen detail" },
    ],
    variants: [
      { sku: "kavya-sage", colorName: "Sage", colorHex: "#9BAE92", stock: 12 },
      { sku: "kavya-rust", colorName: "Rust", colorHex: "#B5562C", stock: 9 },
    ],
    tags: ["office", "linen", "everyday"],
    fabric: "Pure linen",
    occasion: ["office", "casual"],
    status: "active",
    featured: true,
    createdAt: "2026-04-18T10:00:00Z",
  },
  {
    id: "prd_radhika",
    slug: "radhika-chanderi",
    name: "Radhika Chanderi",
    description:
      "Handloom Chanderi in dusty rose with silver zari motifs. Sheer, breathable, festive-light.",
    categorySlug: "silk",
    priceInPaise: 1450000,
    mrpInPaise: 1700000,
    images: [
      { url: baseImages.ivory, alt: "Radhika Chanderi front" },
      { url: baseImages.maroon, alt: "Radhika Chanderi pallu" },
    ],
    variants: [
      { sku: "radhika-rose", colorName: "Dusty rose", colorHex: "#C68A8A", stock: 5 },
      { sku: "radhika-mint", colorName: "Mint", colorHex: "#A9CFC1", stock: 4 },
    ],
    tags: ["festive", "chanderi", "silk-cotton"],
    fabric: "Chanderi silk-cotton",
    occasion: ["festive", "puja"],
    status: "active",
    featured: false,
    createdAt: "2026-04-16T10:00:00Z",
  },
  {
    id: "prd_sita",
    slug: "sita-jamdani",
    name: "Sita Jamdani",
    description: "Bengal Jamdani in ivory with charcoal motifs woven on a handloom.",
    categorySlug: "cotton",
    priceInPaise: 620000,
    mrpInPaise: 780000,
    images: [
      { url: baseImages.ivoryAlt, alt: "Sita Jamdani front" },
      { url: baseImages.ivory, alt: "Sita Jamdani detail" },
    ],
    variants: [{ sku: "sita-ivory", colorName: "Ivory", colorHex: "#EFE8D8", stock: 8 }],
    tags: ["jamdani", "handloom", "cotton"],
    fabric: "Pure cotton handloom",
    occasion: ["office", "festive"],
    status: "active",
    featured: false,
    createdAt: "2026-04-15T10:00:00Z",
  },
  {
    id: "prd_uma",
    slug: "uma-paithani",
    name: "Uma Paithani",
    description:
      "Maharashtrian Paithani in peacock green with a richly woven peacock-and-vine pallu.",
    categorySlug: "silk",
    priceInPaise: 5450000,
    mrpInPaise: 5950000,
    images: [
      { url: baseImages.green, alt: "Uma Paithani front" },
      { url: baseImages.greenAlt, alt: "Uma Paithani pallu" },
    ],
    variants: [{ sku: "uma-peacock", colorName: "Peacock", colorHex: "#1F5F6E", stock: 2 }],
    tags: ["wedding", "paithani", "heritage", "silk"],
    fabric: "Pure paithani silk",
    occasion: ["wedding"],
    status: "active",
    featured: true,
    createdAt: "2026-04-12T10:00:00Z",
  },
  {
    id: "prd_lakshmi",
    slug: "lakshmi-tussar",
    name: "Lakshmi Tussar",
    description: "Beige tussar silk with hand-painted madhubani motifs along the border.",
    categorySlug: "silk",
    priceInPaise: 1850000,
    mrpInPaise: 2100000,
    images: [
      { url: baseImages.ivory, alt: "Lakshmi tussar front" },
      { url: baseImages.maroon, alt: "Lakshmi tussar madhubani" },
    ],
    variants: [
      { sku: "lakshmi-beige", colorName: "Beige", colorHex: "#D6C6A4", stock: 5 },
      { sku: "lakshmi-cocoa", colorName: "Cocoa", colorHex: "#6E4A2A", stock: 3 },
    ],
    tags: ["tussar", "silk", "madhubani"],
    fabric: "Tussar silk",
    occasion: ["festive", "office"],
    status: "active",
    featured: false,
    createdAt: "2026-04-10T10:00:00Z",
  },
  {
    id: "prd_priya",
    slug: "priya-cotton",
    name: "Priya Cotton",
    description: "Crisp ikat cotton from Pochampally in indigo and white, for everyday elegance.",
    categorySlug: "cotton",
    priceInPaise: 340000,
    mrpInPaise: 420000,
    images: [
      { url: baseImages.ivoryAlt, alt: "Priya cotton front" },
      { url: baseImages.ivory, alt: "Priya cotton pallu" },
    ],
    variants: [
      { sku: "priya-indigo", colorName: "Indigo", colorHex: "#243B7B", stock: 14 },
      { sku: "priya-mustard", colorName: "Mustard", colorHex: "#C39B2D", stock: 11 },
    ],
    tags: ["cotton", "ikat", "everyday"],
    fabric: "Pochampally ikat cotton",
    occasion: ["office", "casual"],
    status: "active",
    featured: false,
    createdAt: "2026-04-08T10:00:00Z",
  },
  {
    id: "prd_ananya",
    slug: "ananya-designer",
    name: "Ananya Designer",
    description:
      "Modern pre-stitched saree in midnight crepe with a sequinned palla. Contemporary edit.",
    categorySlug: "designer",
    priceInPaise: 2750000,
    mrpInPaise: 3000000,
    images: [
      { url: baseImages.maroon, alt: "Ananya designer front" },
      { url: baseImages.maroonAlt, alt: "Ananya designer detail" },
    ],
    variants: [
      { sku: "ananya-midnight", colorName: "Midnight", colorHex: "#1B2042", stock: 6 },
      { sku: "ananya-wine", colorName: "Wine", colorHex: "#6F2342", stock: 4 },
    ],
    tags: ["designer", "modern", "cocktail"],
    fabric: "Crepe with sequins",
    occasion: ["cocktail", "reception"],
    status: "active",
    featured: true,
    createdAt: "2026-04-05T10:00:00Z",
  },
  {
    id: "prd_diya",
    slug: "diya-organza",
    name: "Diya Organza",
    description: "Featherlight organza in champagne with hand-embroidered florals.",
    categorySlug: "designer",
    priceInPaise: 1950000,
    mrpInPaise: 2250000,
    images: [
      { url: baseImages.ivory, alt: "Diya organza front" },
      { url: baseImages.greenAlt, alt: "Diya organza detail" },
    ],
    variants: [
      { sku: "diya-champagne", colorName: "Champagne", colorHex: "#E2C892", stock: 5 },
      { sku: "diya-rose", colorName: "Rose", colorHex: "#D49797", stock: 3 },
    ],
    tags: ["organza", "festive", "designer"],
    fabric: "Organza silk",
    occasion: ["festive", "engagement"],
    status: "active",
    featured: false,
    createdAt: "2026-04-02T10:00:00Z",
  },
  {
    id: "prd_nandini",
    slug: "nandini-mysore",
    name: "Nandini Mysore Silk",
    description:
      "Classic Mysore silk in plain rust with a gold zari border. Office-festive crossover.",
    categorySlug: "silk",
    priceInPaise: 1280000,
    mrpInPaise: 1480000,
    images: [
      { url: baseImages.maroonAlt, alt: "Nandini Mysore silk front" },
      { url: baseImages.green, alt: "Nandini Mysore silk pallu" },
    ],
    variants: [
      { sku: "nandini-rust", colorName: "Rust", colorHex: "#A14924", stock: 7 },
      { sku: "nandini-teal", colorName: "Teal", colorHex: "#2F6E73", stock: 5 },
    ],
    tags: ["mysore", "silk", "office"],
    fabric: "Mysore pure silk",
    occasion: ["office", "festive"],
    status: "active",
    featured: false,
    createdAt: "2026-03-30T10:00:00Z",
  },
  {
    id: "prd_isha",
    slug: "isha-handblock",
    name: "Isha Hand-Block Cotton",
    description: "Lightweight cotton with Bagru hand-block prints in indigo and madder red.",
    categorySlug: "cotton",
    priceInPaise: 280000,
    mrpInPaise: 360000,
    images: [
      { url: baseImages.ivoryAlt, alt: "Isha hand-block front" },
      { url: baseImages.maroon, alt: "Isha hand-block detail" },
    ],
    variants: [
      { sku: "isha-indigo", colorName: "Indigo", colorHex: "#23355A", stock: 16 },
      { sku: "isha-madder", colorName: "Madder", colorHex: "#A23A2C", stock: 12 },
    ],
    tags: ["cotton", "bagru", "handblock"],
    fabric: "Hand-block cotton",
    occasion: ["office", "casual"],
    status: "active",
    featured: true,
    createdAt: "2026-03-28T10:00:00Z",
  },
];
```

- [ ] **Step 2: Verify typecheck**

```powershell
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/db/fixtures/products.ts
git commit -m "feat(fixtures): add 12 saree product fixtures"
```

---

## Task 6: Banners and Reviews Fixtures

**Files:**

- Create: `src/lib/db/fixtures/banners.ts`, `src/lib/db/fixtures/reviews.ts`

- [ ] **Step 1: Create src/lib/db/fixtures/banners.ts**

```ts
import type { Banner } from "@/types/domain";

export const BANNERS_FIXTURE: Banner[] = [
  {
    id: "bnr_wedding",
    placement: "home-hero",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=2000&q=80",
    imageAlt: "Bridal silk saree draped on mannequin",
    title: "The Wedding Edit",
    subtitle: "Heirloom Kanjivarams, Banarasis and Paithanis for the season's mehendi to vidaai.",
    ctaLabel: "Shop Bridal",
    ctaHref: "/shop/silk",
    sortOrder: 1,
    active: true,
  },
  {
    id: "bnr_office",
    placement: "home-hero",
    imageUrl:
      "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=2000&q=80",
    imageAlt: "Crisp linen saree draped over chair",
    title: "Linens for the Working Week",
    subtitle: "Featherlight pure linens in modern, muted palettes.",
    ctaLabel: "Shop Linen",
    ctaHref: "/shop/linen",
    sortOrder: 2,
    active: true,
  },
  {
    id: "bnr_festive",
    placement: "home-hero",
    imageUrl:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=2000&q=80",
    imageAlt: "Banarasi festive saree close-up",
    title: "Festive Brocades",
    subtitle: "Banarasis with meenakari pallus, made for diyas and dressy nights.",
    ctaLabel: "Shop Banarasi",
    ctaHref: "/shop/banarasi",
    sortOrder: 3,
    active: true,
  },
  {
    id: "bnr_designer_strip",
    placement: "home-strip",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469973-e1b80fb95e36?auto=format&fit=crop&w=2000&q=80",
    imageAlt: "Designer pre-stitched saree",
    title: "Now in: Designer Edit",
    ctaLabel: "Explore →",
    ctaHref: "/shop/designer",
    sortOrder: 1,
    active: true,
  },
];
```

- [ ] **Step 2: Create src/lib/db/fixtures/reviews.ts**

```ts
import type { Review } from "@/types/domain";

export const REVIEWS_FIXTURE: Review[] = [
  {
    id: "rev_001",
    productId: "prd_amrita",
    authorName: "Aishwarya R.",
    rating: 5,
    title: "Worth every rupee",
    body: "The zari work is gorgeous and the silk feels heavy in the best way. Wore it for the engagement and got endless compliments.",
    createdAt: "2026-04-30T10:00:00Z",
    verifiedPurchase: true,
  },
  {
    id: "rev_002",
    productId: "prd_kavya",
    authorName: "Neha S.",
    rating: 5,
    title: "Office staple",
    body: "Cool, light, and the prints are immaculate. Bought the sage and immediately ordered the rust.",
    createdAt: "2026-04-28T10:00:00Z",
    verifiedPurchase: true,
  },
  {
    id: "rev_003",
    productId: "prd_meera",
    authorName: "Pooja T.",
    rating: 4,
    title: "Beautiful but delicate",
    body: "Absolutely stunning Banarasi. Just remember tissue is delicate — handle with care.",
    createdAt: "2026-04-26T10:00:00Z",
    verifiedPurchase: true,
  },
  {
    id: "rev_004",
    productId: null,
    authorName: "Megha A.",
    rating: 5,
    title: "Genuinely premium",
    body: "Packaging, sourcing, weave authenticity — it's all there. This is the saree shop I've been looking for.",
    createdAt: "2026-04-24T10:00:00Z",
    verifiedPurchase: true,
  },
  {
    id: "rev_005",
    productId: "prd_ananya",
    authorName: "Ritu B.",
    rating: 5,
    title: "Wore it to a wedding reception",
    body: "Pre-stitched is a lifesaver. The midnight is exactly as photographed; sequins are subtle.",
    createdAt: "2026-04-22T10:00:00Z",
    verifiedPurchase: true,
  },
  {
    id: "rev_006",
    productId: "prd_isha",
    authorName: "Sneha P.",
    rating: 4,
    title: "Great everyday cotton",
    body: "The Bagru block work is delightful. Wash gently and it stays beautiful.",
    createdAt: "2026-04-20T10:00:00Z",
    verifiedPurchase: true,
  },
];
```

- [ ] **Step 3: Verify typecheck**

```powershell
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```powershell
git add src/lib/db/fixtures/banners.ts src/lib/db/fixtures/reviews.ts
git commit -m "feat(fixtures): add banner and review fixtures"
```

---

## Task 7: Products Repository (Mock)

**Files:**

- Create: `src/lib/db/repos/products.ts`, `src/lib/db/repos/products.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/db/repos/products.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { productsRepo } from "./products";

describe("productsRepo (mock)", () => {
  it("lists active products only, sorted by createdAt desc", async () => {
    const result = await productsRepo.list();
    expect(result.length).toBeGreaterThanOrEqual(10);
    expect(result.every((p) => p.status === "active")).toBe(true);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.createdAt >= result[i]!.createdAt).toBe(true);
    }
  });

  it("lists featured products", async () => {
    const result = await productsRepo.listFeatured();
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.featured && p.status === "active")).toBe(true);
  });

  it("lists products by category slug", async () => {
    const result = await productsRepo.listByCategory("kanjivaram");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.categorySlug === "kanjivaram")).toBe(true);
  });

  it("gets a product by slug", async () => {
    const product = await productsRepo.getBySlug("amrita-kanjivaram");
    expect(product?.name).toBe("Amrita Kanjivaram");
  });

  it("returns null for unknown slug", async () => {
    const product = await productsRepo.getBySlug("does-not-exist");
    expect(product).toBeNull();
  });

  it("supports a limit option on list", async () => {
    const result = await productsRepo.list({ limit: 3 });
    expect(result).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run failing test**

```powershell
npx vitest run src/lib/db/repos/products.test.ts
```

Expected: 6 failing.

- [ ] **Step 3: Implement src/lib/db/repos/products.ts**

```ts
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
```

- [ ] **Step 4: Run test, confirm pass**

```powershell
npx vitest run src/lib/db/repos/products.test.ts
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/db/repos/products.ts src/lib/db/repos/products.test.ts
git commit -m "feat(repos): add mock productsRepo with list/featured/byCategory/bySlug"
```

---

## Task 8: Categories Repository (Mock)

**Files:**

- Create: `src/lib/db/repos/categories.ts`, `src/lib/db/repos/categories.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

Save as `src/lib/db/repos/categories.test.ts`.

- [ ] **Step 2: Run failing test**

```powershell
npx vitest run src/lib/db/repos/categories.test.ts
```

Expected: 4 failing.

- [ ] **Step 3: Implement src/lib/db/repos/categories.ts**

```ts
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
```

- [ ] **Step 4: Run test, confirm pass**

```powershell
npx vitest run src/lib/db/repos/categories.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/db/repos/categories.ts src/lib/db/repos/categories.test.ts
git commit -m "feat(repos): add mock categoriesRepo"
```

---

## Task 9: Banners and Reviews Repositories (Mock)

**Files:**

- Create: `src/lib/db/repos/banners.ts`, `src/lib/db/repos/banners.test.ts`
- Create: `src/lib/db/repos/reviews.ts`, `src/lib/db/repos/reviews.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/lib/db/repos/banners.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { bannersRepo } from "./banners";

describe("bannersRepo (mock)", () => {
  it("lists active banners by placement sorted by sortOrder", async () => {
    const result = await bannersRepo.listByPlacement("home-hero");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((b) => b.placement === "home-hero" && b.active)).toBe(true);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.sortOrder <= result[i]!.sortOrder).toBe(true);
    }
  });

  it("returns empty for an unknown placement", async () => {
    const result = await bannersRepo.listByPlacement("shop-strip");
    expect(result).toEqual([]);
  });
});
```

`src/lib/db/repos/reviews.test.ts`:

```ts
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
```

- [ ] **Step 2: Run failing tests**

```powershell
npx vitest run src/lib/db/repos/banners.test.ts src/lib/db/repos/reviews.test.ts
```

Expected: 4 failing.

- [ ] **Step 3: Implement src/lib/db/repos/banners.ts**

```ts
import { BANNERS_FIXTURE } from "@/lib/db/fixtures/banners";
import type { Banner, BannerPlacement } from "@/types/domain";

export interface BannersRepo {
  listByPlacement(placement: BannerPlacement): Promise<Banner[]>;
}

export const bannersRepo: BannersRepo = {
  async listByPlacement(placement) {
    return BANNERS_FIXTURE.filter((b) => b.active && b.placement === placement)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
};
```

- [ ] **Step 4: Implement src/lib/db/repos/reviews.ts**

```ts
import { REVIEWS_FIXTURE } from "@/lib/db/fixtures/reviews";
import type { Review } from "@/types/domain";

export interface ReviewListOptions {
  limit?: number;
}

export interface ReviewsRepo {
  listFeatured(options?: ReviewListOptions): Promise<Review[]>;
  listByProduct(productId: string, options?: ReviewListOptions): Promise<Review[]>;
}

function newestFirst(a: Review, b: Review): number {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}

function applyLimit<T>(items: T[], options?: ReviewListOptions): T[] {
  return options?.limit ? items.slice(0, options.limit) : items;
}

export const reviewsRepo: ReviewsRepo = {
  async listFeatured(options) {
    const items = REVIEWS_FIXTURE.slice().sort(newestFirst);
    return applyLimit(items, options);
  },

  async listByProduct(productId, options) {
    const items = REVIEWS_FIXTURE.filter((r) => r.productId === productId)
      .slice()
      .sort(newestFirst);
    return applyLimit(items, options);
  },
};
```

- [ ] **Step 5: Run tests, confirm pass**

```powershell
npx vitest run src/lib/db/repos/banners.test.ts src/lib/db/repos/reviews.test.ts
```

Expected: 4 passed.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/db/repos/banners.ts src/lib/db/repos/banners.test.ts src/lib/db/repos/reviews.ts src/lib/db/repos/reviews.test.ts
git commit -m "feat(repos): add mock bannersRepo and reviewsRepo"
```

---

## Task 10: UI Primitives Batch 1 — Badge, Chip, PriceTag

**Files:**

- Create: `src/components/ui/Badge.tsx`, `src/components/ui/Chip.tsx`, `src/components/ui/PriceTag.tsx`, `src/components/ui/PriceTag.test.tsx`

- [ ] **Step 1: Create src/components/ui/Badge.tsx**

```tsx
import { clsx } from "@/lib/utils/clsx";

type Tone = "neutral" | "accent" | "gold" | "success" | "warning" | "danger";

export interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

const toneClass: Record<Tone, string> = {
  neutral: "bg-bg-elevated text-ink-700 border border-ink-500/20",
  accent: "bg-accent-primary text-white",
  gold: "bg-accent-gold text-white",
  success: "bg-success/10 text-success border border-success/20",
  warning: "bg-warning/10 text-warning border border-warning/30",
  danger: "bg-danger/10 text-danger border border-danger/30",
};

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Create src/lib/utils/clsx.ts**

```ts
export function clsx(...parts: (string | undefined | false | null)[]): string {
  return parts.filter(Boolean).join(" ");
}
```

Delete `src/lib/utils/.gitkeep` once `clsx.ts` is in place.

- [ ] **Step 3: Create src/components/ui/Chip.tsx**

```tsx
import { clsx } from "@/lib/utils/clsx";

export interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Chip({ selected, onClick, children, className }: ChipProps) {
  const isInteractive = typeof onClick === "function";
  const Component = isInteractive ? "button" : "span";
  return (
    <Component
      type={isInteractive ? "button" : undefined}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition",
        selected
          ? "border-accent-primary bg-accent-primary text-white"
          : "border-ink-500/20 bg-bg-elevated text-ink-700 hover:border-ink-700",
        isInteractive && "cursor-pointer",
        className,
      )}
    >
      {children}
    </Component>
  );
}
```

If `Chip`'s `Component` cast warns under strict React 19 types, replace with an explicit `if/else` returning two distinct JSX trees. Functional equivalence is required.

- [ ] **Step 4: Write the failing PriceTag test**

`src/components/ui/PriceTag.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriceTag } from "./PriceTag";

describe("PriceTag", () => {
  it("renders price only when no MRP", () => {
    render(<PriceTag priceInPaise={125000} />);
    expect(screen.getByText("₹1,250")).toBeInTheDocument();
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
  });

  it("renders price + MRP strike + discount % when MRP exceeds price", () => {
    render(<PriceTag priceInPaise={100000} mrpInPaise={150000} />);
    expect(screen.getByText("₹1,000")).toBeInTheDocument();
    expect(screen.getByText("₹1,500")).toBeInTheDocument();
    expect(screen.getByText("33% off")).toBeInTheDocument();
  });

  it("does not render discount when MRP equals price", () => {
    render(<PriceTag priceInPaise={100000} mrpInPaise={100000} />);
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run failing test**

```powershell
npx vitest run src/components/ui/PriceTag.test.tsx
```

Expected: 3 failing.

- [ ] **Step 6: Implement src/components/ui/PriceTag.tsx**

```tsx
import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";

export interface PriceTagProps {
  priceInPaise: number;
  mrpInPaise?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass: Record<NonNullable<PriceTagProps["size"]>, { price: string; rest: string }> = {
  sm: { price: "text-base font-semibold", rest: "text-xs" },
  md: { price: "text-lg font-semibold", rest: "text-sm" },
  lg: { price: "text-2xl font-semibold", rest: "text-base" },
};

export function PriceTag({ priceInPaise, mrpInPaise, size = "md", className }: PriceTagProps) {
  const showStrike = typeof mrpInPaise === "number" && mrpInPaise > priceInPaise;
  const discountPct = showStrike ? Math.round(((mrpInPaise - priceInPaise) / mrpInPaise) * 100) : 0;
  const classes = sizeClass[size];

  return (
    <div className={clsx("flex flex-wrap items-baseline gap-2 tabular-nums", className)}>
      <span className={clsx("text-ink-900", classes.price)}>{formatRupees(priceInPaise)}</span>
      {showStrike && (
        <>
          <span className={clsx("text-ink-500 line-through", classes.rest)}>
            {formatRupees(mrpInPaise)}
          </span>
          <span className={clsx("text-success font-medium", classes.rest)}>{discountPct}% off</span>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Run test, confirm pass**

```powershell
npx vitest run src/components/ui/PriceTag.test.tsx
```

Expected: 3 passed.

- [ ] **Step 8: Commit**

```powershell
git add src/components/ui/Badge.tsx src/components/ui/Chip.tsx src/components/ui/PriceTag.tsx src/components/ui/PriceTag.test.tsx src/lib/utils/clsx.ts
git commit -m "feat(ui): add Badge, Chip, and PriceTag primitives"
```

---

## Task 11: UI Primitives Batch 2 — IconButton, Skeleton, EmptyState

**Files:**

- Create: `src/components/ui/IconButton.tsx`, `src/components/ui/Skeleton.tsx`, `src/components/ui/EmptyState.tsx`

- [ ] **Step 1: Create src/components/ui/IconButton.tsx**

```tsx
import { forwardRef } from "react";
import { clsx } from "@/lib/utils/clsx";

type Variant = "ghost" | "solid" | "outline";
type Size = "sm" | "md" | "lg";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  "aria-label": string;
}

const sizeClass: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const variantClass: Record<Variant, string> = {
  ghost: "bg-transparent text-ink-700 hover:bg-ink-900/5",
  solid: "bg-ink-900 text-white hover:bg-ink-700",
  outline: "border border-ink-500/30 text-ink-700 hover:bg-ink-900/5",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = "ghost", size = "md", className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx(
        "inline-flex items-center justify-center rounded-sm transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2",
        sizeClass[size],
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
```

- [ ] **Step 2: Create src/components/ui/Skeleton.tsx**

```tsx
import { clsx } from "@/lib/utils/clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("animate-pulse rounded-sm bg-ink-500/10", className)} />;
}
```

- [ ] **Step 3: Create src/components/ui/EmptyState.tsx**

```tsx
import type { ReactNode } from "react";
import { clsx } from "@/lib/utils/clsx";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-ink-500/20 bg-bg-elevated px-6 py-16 text-center",
        className,
      )}
    >
      <h3 className="font-display text-2xl text-ink-900">{title}</h3>
      {description && <p className="max-w-md text-sm text-ink-700">{description}</p>}
      {action}
    </div>
  );
}
```

- [ ] **Step 4: Verify typecheck**

```powershell
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```powershell
git add src/components/ui/IconButton.tsx src/components/ui/Skeleton.tsx src/components/ui/EmptyState.tsx
git commit -m "feat(ui): add IconButton, Skeleton, EmptyState primitives"
```

---

## Task 12: Layout Primitives — Container and SectionHeading

**Files:**

- Create: `src/components/ui/Container.tsx`, `src/components/ui/SectionHeading.tsx`

- [ ] **Step 1: Create src/components/ui/Container.tsx**

```tsx
import { clsx } from "@/lib/utils/clsx";

export interface ContainerProps {
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  className?: string;
}

const sizeClass = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export function Container({ size = "lg", children, className }: ContainerProps) {
  return (
    <div className={clsx("mx-auto w-full px-6 md:px-8", sizeClass[size], className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create src/components/ui/SectionHeading.tsx**

```tsx
import { clsx } from "@/lib/utils/clsx";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">{eyebrow}</span>
      )}
      <h2 className="font-display text-3xl text-ink-900 md:text-4xl">{title}</h2>
      {description && <p className="max-w-prose text-ink-700">{description}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/ui/Container.tsx src/components/ui/SectionHeading.tsx
git commit -m "feat(ui): add Container and SectionHeading layout primitives"
```

---

## Task 13: Announcement Bar

**Files:**

- Create: `src/components/shared/AnnouncementBar.tsx`

- [ ] **Step 1: Create src/components/shared/AnnouncementBar.tsx**

```tsx
export function AnnouncementBar() {
  return (
    <div className="bg-ink-900 py-2 text-center text-xs uppercase tracking-[0.2em] text-bg-base">
      Free shipping pan-India on orders over ₹2,000 · COD available
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/shared/AnnouncementBar.tsx
git commit -m "feat(shared): add announcement bar"
```

---

## Task 14: Header

**Files:**

- Create: `src/components/shared/Header.tsx`

- [ ] **Step 1: Create src/components/shared/Header.tsx**

```tsx
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { Container } from "@/components/ui/Container";
import { IconButton } from "@/components/ui/IconButton";

export async function Header() {
  const categories = await categoriesRepo.listTopLevel();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-500/10 bg-bg-base/90 backdrop-blur">
      <Container size="xl">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-3 md:hidden">
            <IconButton aria-label="Open menu" size="sm">
              <Menu className="h-5 w-5" />
            </IconButton>
          </div>

          <Link href="/" className="font-display text-2xl text-ink-900">
            Saree Store
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.slug}
                href={`/shop/${c.slug}`}
                className="text-sm text-ink-700 transition hover:text-ink-900"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/shop"
              className="text-sm font-medium text-accent-primary transition hover:text-accent-primary-hover"
            >
              All Sarees
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <IconButton aria-label="Search" size="sm">
              <Search className="h-5 w-5" />
            </IconButton>
            <IconButton aria-label="Wishlist" size="sm">
              <Heart className="h-5 w-5" />
            </IconButton>
            <IconButton aria-label="Account" size="sm">
              <User className="h-5 w-5" />
            </IconButton>
            <IconButton aria-label="Cart" size="sm">
              <ShoppingBag className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      </Container>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/shared/Header.tsx
git commit -m "feat(shared): add responsive Header with category nav"
```

---

## Task 15: Footer

**Files:**

- Create: `src/components/shared/Footer.tsx`

- [ ] **Step 1: Create src/components/shared/Footer.tsx**

```tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";

const FOOTER_GROUPS = [
  {
    heading: "Shop",
    links: [
      { label: "All sarees", href: "/shop" },
      { label: "Silk", href: "/shop/silk" },
      { label: "Cotton", href: "/shop/cotton" },
      { label: "Linen", href: "/shop/linen" },
      { label: "Designer", href: "/shop/designer" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Shipping", href: "/policies/shipping" },
      { label: "Returns", href: "/policies/returns" },
      { label: "Saree care", href: "/policies/care" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Journal", href: "/blog" },
      { label: "Terms", href: "/policies/terms" },
      { label: "Privacy", href: "/policies/privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-500/10 bg-bg-elevated">
      <Container size="xl">
        <div className="grid gap-10 py-16 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <span className="font-display text-2xl text-ink-900">Saree Store</span>
            <p className="text-sm text-ink-700">
              Handpicked sarees from looms across India. Slow fashion, fairly sourced.
            </p>
            <form className="mt-4 flex max-w-sm gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 rounded-sm border border-ink-500/20 bg-bg-base px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-700"
              >
                Subscribe
              </button>
            </form>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-900">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-ink-700">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-ink-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-500/10 py-6 text-xs text-ink-500">
          © 2026 Saree Store. Crafted in India.
        </div>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/shared/Footer.tsx
git commit -m "feat(shared): add Footer with link groups and newsletter form"
```

---

## Task 16: MarketingShell + Storefront Layout

**Files:**

- Create: `src/components/shared/MarketingShell.tsx`
- Create: `src/app/(storefront)/layout.tsx`

- [ ] **Step 1: Create src/components/shared/MarketingShell.tsx**

```tsx
import { AnnouncementBar } from "./AnnouncementBar";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      {/* Header is async (RSC); Next renders it inline */}
      {/* @ts-expect-error Server Component */}
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

If the `@ts-expect-error` line is no longer needed in your installed TypeScript + Next 16 versions (i.e., `<Header />` already accepts a Promise component without complaint), delete that comment line. Verify by running typecheck after writing the file.

- [ ] **Step 2: Create src/app/(storefront)/layout.tsx**

```tsx
import { MarketingShell } from "@/components/shared/MarketingShell";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
```

- [ ] **Step 3: Verify build**

```powershell
npx next build
```

Expected: build succeeds. `/` should still resolve.

- [ ] **Step 4: Commit**

```powershell
git add src/components/shared/MarketingShell.tsx "src/app/(storefront)/layout.tsx"
git commit -m "feat(storefront): wrap storefront pages in MarketingShell layout"
```

---

## Task 17: ProductCard

**Files:**

- Create: `src/components/storefront/ProductCard.tsx`

- [ ] **Step 1: Create src/components/storefront/ProductCard.tsx**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "@/lib/utils/clsx";
import { PriceTag } from "@/components/ui/PriceTag";
import type { Product } from "@/types/domain";

export interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority, className }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const primaryImage = product.images[0];
  const secondaryImage = product.images[1] ?? primaryImage;
  const currentImage = hovered ? secondaryImage : primaryImage;

  if (!primaryImage || !currentImage) return null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className={clsx("group flex flex-col gap-3", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-ink-500/5">
        <Image
          src={currentImage.url}
          alt={currentImage.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-lg text-ink-900">{product.name}</h3>
        <span className="text-xs uppercase tracking-wide text-ink-500">{product.fabric}</span>
        <div className="mt-1 flex items-center justify-between">
          <PriceTag priceInPaise={product.priceInPaise} mrpInPaise={product.mrpInPaise} size="sm" />
          <div className="flex items-center gap-1">
            {product.variants.slice(0, 4).map((v) => (
              <span
                key={v.sku}
                aria-label={v.colorName}
                title={v.colorName}
                className="h-3 w-3 rounded-full border border-ink-500/30"
                style={{ background: v.colorHex }}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/storefront/ProductCard.tsx
git commit -m "feat(storefront): add ProductCard with hover-swap and color swatches"
```

---

## Task 18: CategoryTile

**Files:**

- Create: `src/components/storefront/CategoryTile.tsx`

- [ ] **Step 1: Create src/components/storefront/CategoryTile.tsx**

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types/domain";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/shop/${category.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-ink-900"
    >
      <Image
        src={category.imageUrl}
        alt={category.name}
        fill
        sizes="(min-width: 1024px) 33vw, 50vw"
        className="object-cover opacity-90 transition duration-500 group-hover:scale-[1.05] group-hover:opacity-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-6 text-white">
        <span className="text-xs uppercase tracking-[0.2em] opacity-80">Collection</span>
        <h3 className="font-display text-2xl">{category.name}</h3>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/storefront/CategoryTile.tsx
git commit -m "feat(storefront): add CategoryTile with gradient overlay"
```

---

## Task 19: BannerHero (Embla)

**Files:**

- Create: `src/components/storefront/BannerHero.tsx`

- [ ] **Step 1: Create src/components/storefront/BannerHero.tsx**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { clsx } from "@/lib/utils/clsx";
import { Container } from "@/components/ui/Container";
import type { Banner } from "@/types/domain";

export interface BannerHeroProps {
  banners: Banner[];
}

export function BannerHero({ banners }: BannerHeroProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 35 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    const interval = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => {
      emblaApi.off("select", onSelect);
      clearInterval(interval);
    };
  }, [emblaApi, onSelect]);

  if (banners.length === 0) return null;

  return (
    <section className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {banners.map((banner, idx) => (
            <div key={banner.id} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative h-[60vh] min-h-[420px] w-full md:h-[72vh]">
                <Image
                  src={banner.imageUrl}
                  alt={banner.imageAlt}
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-900/55 via-ink-900/20 to-transparent" />
                <Container size="xl" className="relative flex h-full items-center">
                  <div className="max-w-xl text-white">
                    <span className="text-xs uppercase tracking-[0.25em] opacity-90">The Edit</span>
                    <h1 className="mt-3 font-display text-4xl md:text-6xl">{banner.title}</h1>
                    {banner.subtitle && (
                      <p className="mt-4 max-w-md text-base opacity-90 md:text-lg">
                        {banner.subtitle}
                      </p>
                    )}
                    <Link
                      href={banner.ctaHref}
                      className="mt-8 inline-flex items-center justify-center rounded-sm bg-bg-base px-6 py-3 text-sm font-medium text-ink-900 transition hover:bg-bg-elevated"
                    >
                      {banner.ctaLabel}
                    </Link>
                  </div>
                </Container>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {banners.map((b, idx) => (
          <button
            key={b.id}
            type="button"
            aria-label={`Slide ${idx + 1}`}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={clsx(
              "h-1 rounded-full transition-all",
              selectedIndex === idx ? "w-10 bg-bg-base" : "w-4 bg-bg-base/40",
            )}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

```powershell
npx next build
```

Expected: build succeeds with no Embla SSR errors.

- [ ] **Step 3: Commit**

```powershell
git add src/components/storefront/BannerHero.tsx
git commit -m "feat(storefront): add Embla-powered BannerHero with autoplay and dots"
```

---

## Task 20: CollectionRail

**Files:**

- Create: `src/components/storefront/CollectionRail.tsx`

- [ ] **Step 1: Create src/components/storefront/CollectionRail.tsx**

```tsx
"use client";

import { useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { IconButton } from "@/components/ui/IconButton";
import { SectionHeading } from "@/components/ui/SectionHeading";

export interface CollectionRailProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function CollectionRail({ eyebrow, title, description, children }: CollectionRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }, []);

  return (
    <section className="py-20">
      <Container size="xl">
        <div className="mb-8 flex items-end justify-between gap-6">
          <SectionHeading eyebrow={eyebrow} title={title} description={description} />
          <div className="hidden items-center gap-2 md:flex">
            <IconButton aria-label="Previous" variant="outline" onClick={() => scrollBy(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </IconButton>
            <IconButton aria-label="Next" variant="outline" onClick={() => scrollBy(1)}>
              <ChevronRight className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
        <div
          ref={scrollerRef}
          className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:-mx-8 md:px-8 [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
      </Container>
    </section>
  );
}
```

> Note: `CollectionRail` accepts children (e.g., `ProductCard` instances wrapped in a snap-aligned div). The home page composes it in Task 25.

- [ ] **Step 2: Commit**

```powershell
git add src/components/storefront/CollectionRail.tsx
git commit -m "feat(storefront): add CollectionRail with snap-scroll and arrow controls"
```

---

## Task 21: ReviewCarousel

**Files:**

- Create: `src/components/storefront/ReviewCarousel.tsx`

- [ ] **Step 1: Create src/components/storefront/ReviewCarousel.tsx**

```tsx
"use client";

import useEmblaCarousel from "embla-carousel-react";
import { Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Review } from "@/types/domain";

export function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const [emblaRef] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });

  if (reviews.length === 0) return null;

  return (
    <section className="bg-bg-elevated py-20">
      <Container size="xl">
        <SectionHeading
          eyebrow="From the community"
          title="What customers say"
          align="center"
          className="mb-10"
        />
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-6">
            {reviews.map((r) => (
              <figure
                key={r.id}
                className="flex min-w-0 flex-[0_0_85%] flex-col gap-4 rounded-md border border-ink-500/10 bg-bg-base p-8 md:flex-[0_0_45%] lg:flex-[0_0_30%]"
              >
                <div className="flex items-center gap-1 text-accent-gold">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                {r.title && <h3 className="font-display text-xl text-ink-900">{r.title}</h3>}
                <blockquote className="text-sm text-ink-700">&ldquo;{r.body}&rdquo;</blockquote>
                <figcaption className="mt-auto text-xs uppercase tracking-wide text-ink-500">
                  {r.authorName}
                  {r.verifiedPurchase && " · Verified buyer"}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/storefront/ReviewCarousel.tsx
git commit -m "feat(storefront): add ReviewCarousel with star ratings"
```

---

## Task 22: StorytellerSection

**Files:**

- Create: `src/components/storefront/StorytellerSection.tsx`

- [ ] **Step 1: Create src/components/storefront/StorytellerSection.tsx**

```tsx
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function StorytellerSection() {
  return (
    <section className="py-20">
      <Container size="xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md">
            <Image
              src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80"
              alt="Weaver hands at a handloom"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-5">
            <span className="text-xs uppercase tracking-[0.25em] text-accent-gold">Our craft</span>
            <h2 className="font-display text-3xl text-ink-900 md:text-5xl">
              Woven by hand, sourced with care.
            </h2>
            <p className="text-ink-700">
              Every saree in our edit is sourced directly from weavers across Kanchipuram, Varanasi,
              Paithan, and the looms of Bengal. We work with cooperatives that pay fairly and
              preserve heritage techniques that machines cannot match.
            </p>
            <p className="text-ink-700">
              We're slow on purpose. New collections drop only when we find pieces that meet a bar
              most fashion houses skip.
            </p>
            <Link
              href="/about"
              className="mt-2 inline-flex w-fit items-center justify-center rounded-sm border border-ink-900 px-6 py-3 text-sm font-medium text-ink-900 transition hover:bg-ink-900 hover:text-white"
            >
              Read our story
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/storefront/StorytellerSection.tsx
git commit -m "feat(storefront): add StorytellerSection (founder/craft)"
```

---

## Task 23: InstagramStrip

**Files:**

- Create: `src/components/storefront/InstagramStrip.tsx`

- [ ] **Step 1: Create src/components/storefront/InstagramStrip.tsx**

```tsx
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const INSTAGRAM_TILES = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1583391733981-86d0d2c0e9aa?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1610030469973-e1b80fb95e36?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=600&q=80",
];

export function InstagramStrip() {
  return (
    <section className="py-20">
      <Container size="xl">
        <SectionHeading
          eyebrow="@saree.store"
          title="From the gram"
          align="center"
          className="mb-10"
        />
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {INSTAGRAM_TILES.map((url, idx) => (
            <Link
              key={url}
              href="https://instagram.com"
              className="group relative aspect-square overflow-hidden"
            >
              <Image
                src={url}
                alt={`Instagram tile ${idx + 1}`}
                fill
                sizes="(min-width: 768px) 16vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/storefront/InstagramStrip.tsx
git commit -m "feat(storefront): add InstagramStrip with 6-tile grid"
```

---

## Task 24: Compose Home Page

**Files:**

- Modify: `src/app/(storefront)/page.tsx`

- [ ] **Step 1: Replace src/app/(storefront)/page.tsx**

```tsx
import { bannersRepo } from "@/lib/db/repos/banners";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { reviewsRepo } from "@/lib/db/repos/reviews";
import { BannerHero } from "@/components/storefront/BannerHero";
import { CategoryTile } from "@/components/storefront/CategoryTile";
import { CollectionRail } from "@/components/storefront/CollectionRail";
import { InstagramStrip } from "@/components/storefront/InstagramStrip";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ReviewCarousel } from "@/components/storefront/ReviewCarousel";
import { StorytellerSection } from "@/components/storefront/StorytellerSection";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export default async function HomePage() {
  const [heroBanners, categories, featured, newest, reviews] = await Promise.all([
    bannersRepo.listByPlacement("home-hero"),
    categoriesRepo.listTopLevel(),
    productsRepo.listFeatured({ limit: 8 }),
    productsRepo.list({ limit: 8 }),
    reviewsRepo.listFeatured({ limit: 6 }),
  ]);

  return (
    <>
      <BannerHero banners={heroBanners} />

      <section className="py-20">
        <Container size="xl">
          <SectionHeading
            eyebrow="Shop by craft"
            title="Explore the edit"
            description="Categories curated for the way you wear sarees."
            className="mb-10"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {categories.slice(0, 6).map((cat) => (
              <CategoryTile key={cat.slug} category={cat} />
            ))}
          </div>
        </Container>
      </section>

      <CollectionRail
        eyebrow="Just in"
        title="New arrivals"
        description="The most recent additions to our edit."
      >
        {newest.map((p) => (
          <div
            key={p.id}
            className="min-w-0 flex-[0_0_70%] snap-start md:flex-[0_0_30%] lg:flex-[0_0_22%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </CollectionRail>

      <StorytellerSection />

      <CollectionRail
        eyebrow="Editor's picks"
        title="Featured this season"
        description="Sarees we keep reaching for."
      >
        {featured.map((p) => (
          <div
            key={p.id}
            className="min-w-0 flex-[0_0_70%] snap-start md:flex-[0_0_30%] lg:flex-[0_0_22%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </CollectionRail>

      <ReviewCarousel reviews={reviews} />

      <InstagramStrip />
    </>
  );
}
```

- [ ] **Step 2: Verify build**

```powershell
npx next build
```

Expected: build succeeds. All sections render without runtime errors.

- [ ] **Step 3: Commit**

```powershell
git add "src/app/(storefront)/page.tsx"
git commit -m "feat(home): compose home page with hero, categories, rails, story, reviews, IG"
```

---

## Task 25: /dev/ui Component Showcase

**Files:**

- Create: `src/app/dev/ui/page.tsx`

- [ ] **Step 1: Create src/app/dev/ui/page.tsx**

```tsx
import { Heart } from "lucide-react";
import { productsRepo } from "@/lib/db/repos/products";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { PriceTag } from "@/components/ui/PriceTag";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata = { title: "Component Showcase" };

export default async function DevUiPage() {
  const sample = await productsRepo.listFeatured({ limit: 4 });

  return (
    <Container size="xl" className="py-16">
      <SectionHeading
        eyebrow="Internal"
        title="Component showcase"
        description="A visual reference of every UI primitive and storefront section."
        className="mb-12"
      />

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="accent">New</Badge>
          <Badge tone="gold">Bestseller</Badge>
          <Badge tone="success">In stock</Badge>
          <Badge tone="warning">Few left</Badge>
          <Badge tone="danger">Sold out</Badge>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">Chips</h2>
        <div className="flex flex-wrap gap-2">
          <Chip>Silk</Chip>
          <Chip selected>Cotton</Chip>
          <Chip>Linen</Chip>
          <Chip>Designer</Chip>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">PriceTag</h2>
        <div className="flex flex-col gap-4">
          <PriceTag priceInPaise={125000} size="sm" />
          <PriceTag priceInPaise={125000} mrpInPaise={150000} />
          <PriceTag priceInPaise={4250000} mrpInPaise={4800000} size="lg" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">IconButton</h2>
        <div className="flex items-center gap-3">
          <IconButton aria-label="Heart ghost" variant="ghost">
            <Heart className="h-5 w-5" />
          </IconButton>
          <IconButton aria-label="Heart outline" variant="outline">
            <Heart className="h-5 w-5" />
          </IconButton>
          <IconButton aria-label="Heart solid" variant="solid">
            <Heart className="h-5 w-5" />
          </IconButton>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">Skeleton</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">EmptyState</h2>
        <EmptyState
          title="Nothing here yet"
          description="Once products are added, you'll see them in this grid."
        />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">ProductCard</h2>
        <div className="grid gap-6 md:grid-cols-4">
          {sample.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </Container>
  );
}
```

- [ ] **Step 2: Verify the page builds and renders**

```powershell
npx next build
```

Expected: `/dev/ui` route registered, build succeeds.

- [ ] **Step 3: Commit**

```powershell
git add src/app/dev/ui/page.tsx
git commit -m "feat(dev): add /dev/ui component showcase page"
```

---

## Task 26: E2E Visual Smoke Test for Home

**Files:**

- Create: `tests/e2e/home.spec.ts`

- [ ] **Step 1: Create tests/e2e/home.spec.ts**

```ts
import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test("renders hero, category tiles, product rails, reviews, and IG strip", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();

    // Hero
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Section headings (at least 3 across the page)
    const sectionHeadings = page.locator("h2");
    await expect(sectionHeadings).not.toHaveCount(0);

    // At least one product card link exists
    const productLinks = page.locator("a[href^='/product/']");
    expect(await productLinks.count()).toBeGreaterThan(0);

    // Instagram tiles
    const igLinks = page.locator("a[href='https://instagram.com']");
    expect(await igLinks.count()).toBeGreaterThanOrEqual(6);
  });

  test("clicking a product card navigates to /product/<slug>", async ({ page }) => {
    await page.goto("/");
    const firstProduct = page.locator("a[href^='/product/']").first();
    const href = await firstProduct.getAttribute("href");
    expect(href).toMatch(/^\/product\//);
    // Don't actually navigate; product detail page lands in Phase 2.
  });
});
```

- [ ] **Step 2: Run e2e**

```powershell
npm run e2e
```

Expected: 2 (or 3 including the existing smoke test) tests passing.

- [ ] **Step 3: Commit**

```powershell
git add tests/e2e/home.spec.ts
git commit -m "test(e2e): add home page visual smoke and product-link navigation tests"
```

---

## Task 27: Final Verification + Tag

- [ ] **Step 1: Run the full verification suite**

```powershell
npx prettier --check .
npx eslint .
npx tsc --noEmit
npx vitest run
npx next build
```

Expected: all five exit 0 (or report no errors in their respective tools, regardless of the npm-wrapper exit-code quirk).

- [ ] **Step 2: Run E2E**

```powershell
npm run e2e
```

Expected: all e2e tests pass (smoke + home).

- [ ] **Step 3: Manually open `/` and `/dev/ui` in a browser (if practical)**

If a dev environment is available, open:

- http://localhost:3000/ (run `npm run dev` first) — visual sanity check.
- http://localhost:3000/dev/ui — primitive showcase.

If not practical, rely on the e2e + build verification above.

- [ ] **Step 4: Tag the phase complete**

```powershell
git tag -a phase-1-complete -m "Phase 1 (design system + home page) complete"
```

---

## What's NOT in this phase (deferred)

- **Shop listing page + Product detail page** — Phase 2.
- **Cart and checkout** — Phase 3.
- **Auth UI** — Phase 4.
- **Account UI** — Phase 5.
- **Admin UI** — Phases 6–7.
- **Static pages + blog** — Phase 8.
- **Real DynamoDB** — Phase 8+ (after all UI is done).
- **Search, filters, sort** — Phase 2 (shop listing).
- **Real wishlist persistence** — Phase 5.
- **Real cart actions** — Phase 3 (with stubbed mutations) and Phase 8+ (with real persistence).

## Spec Coverage Checklist (Phase 1 scope only)

- §5 data model: `Product`, `Category`, `Banner`, `Review` types and repos covered for the read patterns the home page needs. Variants present as nested data; not yet exercised by UI selection (that's Phase 2 product detail).
- §13.1 brand direction: editorial, boutique, gold-and-crimson palette — reflected in tokens (Phase 0) and applied across home sections.
- §13.2 tokens: consumed via Tailwind utilities throughout.
- §13.3 component library: subset built — Badge, Chip, PriceTag, IconButton, Skeleton, EmptyState, Container, SectionHeading, ProductCard, CategoryTile, BannerHero, CollectionRail, ReviewCarousel, StorytellerSection, InstagramStrip, Header, Footer, MarketingShell, AnnouncementBar. The remaining primitives (Input, Select, Checkbox, Radio, Toast, Sheet, Modal, Tabs, Accordion, Breadcrumb, Pagination, RatingStars, VariantPicker, QuantityStepper, FilterDrawer, Sort, AddToCartButton, CartLine, AddressCard, OrderStatusTimeline) ship in the phases that first need them.
- §13.4 home page highlights: hero (parallax-ish via Embla autoplay), curated collection rails, "Shop by Fabric/craft" tile grid, storyteller, reviews carousel, Instagram strip — all present.
- §13.5 responsive + a11y: mobile-first widths, focus rings on IconButton, prefers-reduced-motion respected via Phase 0 CSS, AVIF/WebP via next/image.
- §13.6 SEO: page-level `metadata` will be tuned in Phase 9 polish; basic page title from Phase 0 root metadata applies.
- §13.7 perf budget: priority on hero image; rails snap-scroll; Embla is lightweight; no measurement yet (lighthouse pass in Phase 9).
