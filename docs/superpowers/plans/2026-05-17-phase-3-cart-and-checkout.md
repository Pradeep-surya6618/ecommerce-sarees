# Phase 3 — Cart + Checkout UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the end-to-end add-to-cart → cart drawer → cart page → 3-step checkout → mock payment → order confirmation flow on top of the Phase 1–2 mock repository layer. Cart persistence is server-side (no localStorage) keyed by a signed guest-session cookie, so swapping the in-memory implementation for DynamoDB in a later phase is a single-file change.

**Architecture:** Cart and Order data live in mock repositories (in-memory `Map` keyed by id), accessed through async interfaces that match the eventual DynamoDB shape. A `gs_xxxxx` httpOnly cookie identifies the guest cart on every request. Mutations are Next 16 Server Actions that read/write the cookie via `cookies()` and call `revalidatePath()` after each change so the header cart count refreshes. Checkout is a 3-step accordion on a single `/checkout` page (Address → Shipping → Payment) with state held client-side; the `placeOrder` Server Action snapshots the cart into an Order and clears the cart. Payment is stubbed — the order is marked `confirmed` regardless of method until Phase 5 wires real Razorpay.

**Tech Stack:** Same as Phases 1–2 plus React Hook Form + Zod (already installed) for the checkout forms. No new dependencies.

**Reference spec:** `docs/superpowers/specs/2026-05-16-saree-ecom-design.md` §7 (Cart), §8 (Checkout), §9 (Payments — stubbed here, real in Phase 5).

---

## File Map

```
✎ src/types/domain.ts                                  # add Cart/CartItem/Address/Shipping/Order types
✚ src/lib/db/fixtures/orders.ts                        # empty seed (Map() in-memory)
✚ src/lib/db/repos/cart.ts                             # mock cartRepo singleton
✚ src/lib/db/repos/cart.test.ts
✚ src/lib/db/repos/orders.ts                           # mock ordersRepo
✚ src/lib/db/repos/orders.test.ts
✚ src/lib/cart/guest-session.ts                        # gs_xxx cookie helpers
✚ src/lib/cart/totals.ts                               # subtotal/tax/shipping/total math + tests
✚ src/lib/cart/totals.test.ts
✚ src/lib/cart/shipping.ts                             # mock shipping options + free-shipping rule
✚ src/lib/cart/india-states.ts                         # static states list
✚ src/server/actions/cart.ts                           # addToCart / updateCartItem / removeCartItem / clearCart
✚ src/server/actions/cart.test.ts
✚ src/server/actions/orders.ts                         # placeOrder
✚ src/server/actions/orders.test.ts
✚ src/components/ui/Input.tsx
✚ src/components/ui/FormField.tsx                      # label + control + error wrapper
✚ src/components/storefront/CartTrigger.tsx            # client island: cart icon + count + Sheet drawer
✚ src/components/storefront/CartDrawer.tsx             # drawer contents (line items + summary + CTAs)
✚ src/components/storefront/CartLineItem.tsx
✚ src/components/storefront/CartSummary.tsx
✎ src/components/shared/Header.tsx                     # replace plain cart IconButton with CartTrigger
✎ src/components/storefront/ProductBuyBox.tsx         # call real addToCart server action via AddToCartButton
✎ src/components/ui/AddToCartButton.tsx                # accept onAdd handler (form action / fn)
✚ src/components/checkout/CheckoutStepper.tsx
✚ src/components/checkout/AddressForm.tsx              # RHF + Zod
✚ src/components/checkout/ShippingOptionPicker.tsx
✚ src/components/checkout/PaymentMethodPicker.tsx
✚ src/components/checkout/CheckoutSummary.tsx          # sticky order summary
✚ src/components/checkout/CheckoutFlow.tsx             # main client island wiring the 3 steps
✚ src/app/(storefront)/cart/page.tsx
✚ src/app/(storefront)/checkout/page.tsx
✚ src/app/(storefront)/checkout/success/[orderId]/page.tsx
✚ tests/e2e/cart.spec.ts
✚ tests/e2e/checkout.spec.ts
```

Notes:

- Money in paise throughout.
- IDs: `cart_xxxx`, `ord_xxxx` via `nanoid(12)` (installed in Phase 0).
- Tax: flat 5% GST on subtotal (saree HSN rate).
- Free shipping at subtotal ≥ ₹2,000; otherwise pick from std/express.
- Cart cookie: `gs_session` httpOnly + Secure (in prod) + SameSite=Lax, 30 day max-age.
- Server Actions in `src/server/actions/`: the `"use server"` directive at the top of each file.

---

## Task 1: Extend domain types

**File:** modify `src/types/domain.ts` (append at the end).

- [ ] **Step 1: Append to `src/types/domain.ts`**

```ts
export interface Address {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: "IN";
}

export interface CartItem {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantSku: string;
  variantLabel: string;
  imageUrl: string;
  unitPricePaise: number;
  unitMrpPaise: number;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  id: string;
  userId: string | null;
  guestSessionId: string | null;
  items: CartItem[];
  updatedAt: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  etaDays: number;
  pricePaise: number;
}

export type PaymentMethod = "razorpay" | "cod";

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "payment_failed";

export interface OrderItem {
  productId: string;
  productSlug: string;
  productName: string;
  variantSku: string;
  variantLabel: string;
  imageUrl: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

export interface Order {
  id: string;
  userId: string | null;
  guestSessionId: string | null;
  items: OrderItem[];
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "failed";
  shippingAddress: Address;
  shippingOption: ShippingOption;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Verify typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```powershell
git add src/types/domain.ts
git commit -m "feat(types): add Cart, Order, Address, Shipping domain types"
```

---

## Task 2: Cart totals helper (TDD)

**Files:** `src/lib/cart/totals.ts`, `src/lib/cart/totals.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from "vitest";
import type { CartItem } from "@/types/domain";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise, GST_RATE } from "./totals";

const item = (unitPricePaise: number, quantity: number): CartItem => ({
  id: "ci_x",
  productId: "p",
  productSlug: "p",
  productName: "P",
  variantSku: "sku",
  variantLabel: "Colour",
  imageUrl: "https://example.com/x.jpg",
  unitPricePaise,
  unitMrpPaise: unitPricePaise,
  quantity,
  addedAt: "2026-05-17T00:00:00Z",
});

describe("cart totals", () => {
  it("computes subtotal as sum of unit price × quantity", () => {
    expect(computeSubtotalPaise([item(100000, 2), item(50000, 1)])).toBe(250000);
  });

  it("computes 5% GST rounded to nearest paise", () => {
    expect(GST_RATE).toBe(0.05);
    expect(computeTaxPaise(100000)).toBe(5000);
    expect(computeTaxPaise(123456)).toBe(6173);
  });

  it("computes total as subtotal + tax + shipping", () => {
    expect(computeTotalPaise({ subtotalPaise: 200000, taxPaise: 10000, shippingPaise: 8000 })).toBe(
      218000,
    );
  });
});
```

- [ ] **Step 2: Run, confirm 3 failing**

```powershell
npx vitest run src/lib/cart/totals.test.ts
```

- [ ] **Step 3: Implement `src/lib/cart/totals.ts`**

```ts
import type { CartItem } from "@/types/domain";

export const GST_RATE = 0.05;

export function computeSubtotalPaise(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPricePaise * i.quantity, 0);
}

export function computeTaxPaise(subtotalPaise: number): number {
  return Math.round(subtotalPaise * GST_RATE);
}

export function computeTotalPaise(parts: {
  subtotalPaise: number;
  taxPaise: number;
  shippingPaise: number;
}): number {
  return parts.subtotalPaise + parts.taxPaise + parts.shippingPaise;
}
```

- [ ] **Step 4: Run, confirm 3 passing**

```powershell
npx vitest run src/lib/cart/totals.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/lib/cart/totals.ts src/lib/cart/totals.test.ts
git commit -m "feat(cart): add subtotal/tax/total helpers with 5% GST"
```

---

## Task 3: Shipping options helper

**File:** `src/lib/cart/shipping.ts`

- [ ] **Step 1: Create the file**

```ts
import type { ShippingOption } from "@/types/domain";

const FREE_SHIPPING_THRESHOLD_PAISE = 200000; // ₹2,000

export const STANDARD_SHIPPING: ShippingOption = {
  id: "std",
  name: "Standard delivery",
  etaDays: 5,
  pricePaise: 8000,
};

export const EXPRESS_SHIPPING: ShippingOption = {
  id: "exp",
  name: "Express delivery",
  etaDays: 2,
  pricePaise: 20000,
};

export const FREE_SHIPPING: ShippingOption = {
  id: "free",
  name: "Free shipping",
  etaDays: 7,
  pricePaise: 0,
};

export function getShippingOptions(subtotalPaise: number): ShippingOption[] {
  const opts: ShippingOption[] = [STANDARD_SHIPPING, EXPRESS_SHIPPING];
  if (subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE) {
    return [FREE_SHIPPING, ...opts];
  }
  return opts;
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/lib/cart/shipping.ts
git commit -m "feat(cart): add shipping options helper with free-shipping threshold"
```

---

## Task 4: India states list

**File:** `src/lib/cart/india-states.ts`

- [ ] **Step 1: Create the file**

```ts
export const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export type IndiaState = (typeof INDIA_STATES)[number];
```

- [ ] **Step 2: Commit**

```powershell
git add src/lib/cart/india-states.ts
git commit -m "feat(cart): add Indian states list constant"
```

---

## Task 5: Guest session cookie helper

**File:** `src/lib/cart/guest-session.ts`

- [ ] **Step 1: Create the file**

```ts
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

const COOKIE_NAME = "gs_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function getGuestSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function ensureGuestSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;
  const id = `gs_${nanoid(12)}`;
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return id;
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/lib/cart/guest-session.ts
git commit -m "feat(cart): add guest-session cookie helper"
```

---

## Task 6: cartRepo (mock, TDD)

**Files:** `src/lib/db/repos/cart.ts`, `src/lib/db/repos/cart.test.ts`

The mock holds carts in an in-memory `Map`. State survives within a single Node process; for tests we expose a `__reset` helper.

- [ ] **Step 1: Write failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { __resetCartRepo, cartRepo } from "./cart";

describe("cartRepo (mock)", () => {
  beforeEach(() => __resetCartRepo());

  it("creates an empty cart on first access", async () => {
    const cart = await cartRepo.getOrCreateForGuestSession("gs_test1");
    expect(cart.id).toMatch(/^cart_/);
    expect(cart.guestSessionId).toBe("gs_test1");
    expect(cart.items).toEqual([]);
  });

  it("returns the same cart on repeat access", async () => {
    const a = await cartRepo.getOrCreateForGuestSession("gs_test2");
    const b = await cartRepo.getOrCreateForGuestSession("gs_test2");
    expect(b.id).toBe(a.id);
  });

  it("adds a new item", async () => {
    const cart = await cartRepo.addItem("gs_test3", {
      productId: "p",
      productSlug: "p-slug",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 2,
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(2);
  });

  it("merges quantity on duplicate sku", async () => {
    await cartRepo.addItem("gs_test4", {
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 1,
    });
    const cart = await cartRepo.addItem("gs_test4", {
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 3,
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(4);
  });

  it("updates quantity of a specific item", async () => {
    let cart = await cartRepo.addItem("gs_test5", {
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 1,
    });
    const itemId = cart.items[0]!.id;
    cart = await cartRepo.updateQuantity("gs_test5", itemId, 5);
    expect(cart.items[0]?.quantity).toBe(5);
  });

  it("removes an item", async () => {
    let cart = await cartRepo.addItem("gs_test6", {
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 1,
    });
    const itemId = cart.items[0]!.id;
    cart = await cartRepo.removeItem("gs_test6", itemId);
    expect(cart.items).toHaveLength(0);
  });

  it("clears the cart", async () => {
    await cartRepo.addItem("gs_test7", {
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 1,
    });
    const cart = await cartRepo.clear("gs_test7");
    expect(cart.items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run, confirm 7 failing**

```powershell
npx vitest run src/lib/db/repos/cart.test.ts
```

- [ ] **Step 3: Implement `src/lib/db/repos/cart.ts`**

```ts
import { nanoid } from "nanoid";
import type { Cart, CartItem } from "@/types/domain";

export interface AddItemInput {
  productId: string;
  productSlug: string;
  productName: string;
  variantSku: string;
  variantLabel: string;
  imageUrl: string;
  unitPricePaise: number;
  unitMrpPaise: number;
  quantity: number;
}

export interface CartRepo {
  getOrCreateForGuestSession(guestSessionId: string): Promise<Cart>;
  addItem(guestSessionId: string, input: AddItemInput): Promise<Cart>;
  updateQuantity(guestSessionId: string, itemId: string, quantity: number): Promise<Cart>;
  removeItem(guestSessionId: string, itemId: string): Promise<Cart>;
  clear(guestSessionId: string): Promise<Cart>;
}

const carts = new Map<string, Cart>(); // key: guestSessionId

function nowIso(): string {
  return new Date().toISOString();
}

function ensureCart(guestSessionId: string): Cart {
  const existing = carts.get(guestSessionId);
  if (existing) return existing;
  const cart: Cart = {
    id: `cart_${nanoid(12)}`,
    userId: null,
    guestSessionId,
    items: [],
    updatedAt: nowIso(),
  };
  carts.set(guestSessionId, cart);
  return cart;
}

export const cartRepo: CartRepo = {
  async getOrCreateForGuestSession(guestSessionId) {
    return ensureCart(guestSessionId);
  },

  async addItem(guestSessionId, input) {
    const cart = ensureCart(guestSessionId);
    const existing = cart.items.find((i) => i.variantSku === input.variantSku);
    if (existing) {
      existing.quantity += input.quantity;
    } else {
      const item: CartItem = {
        id: `ci_${nanoid(10)}`,
        productId: input.productId,
        productSlug: input.productSlug,
        productName: input.productName,
        variantSku: input.variantSku,
        variantLabel: input.variantLabel,
        imageUrl: input.imageUrl,
        unitPricePaise: input.unitPricePaise,
        unitMrpPaise: input.unitMrpPaise,
        quantity: input.quantity,
        addedAt: nowIso(),
      };
      cart.items.push(item);
    }
    cart.updatedAt = nowIso();
    return cart;
  },

  async updateQuantity(guestSessionId, itemId, quantity) {
    const cart = ensureCart(guestSessionId);
    const item = cart.items.find((i) => i.id === itemId);
    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter((i) => i.id !== itemId);
      } else {
        item.quantity = quantity;
      }
      cart.updatedAt = nowIso();
    }
    return cart;
  },

  async removeItem(guestSessionId, itemId) {
    const cart = ensureCart(guestSessionId);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.updatedAt = nowIso();
    return cart;
  },

  async clear(guestSessionId) {
    const cart = ensureCart(guestSessionId);
    cart.items = [];
    cart.updatedAt = nowIso();
    return cart;
  },
};

export function __resetCartRepo(): void {
  carts.clear();
}
```

- [ ] **Step 4: Run, confirm 7 passing**

```powershell
npx vitest run src/lib/db/repos/cart.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/lib/db/repos/cart.ts src/lib/db/repos/cart.test.ts
git commit -m "feat(repos): add mock cartRepo with add/update/remove/clear"
```

---

## Task 7: ordersRepo (mock, TDD)

**Files:** `src/lib/db/repos/orders.ts`, `src/lib/db/repos/orders.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import type { Address, OrderItem, ShippingOption } from "@/types/domain";
import { __resetOrdersRepo, ordersRepo } from "./orders";

const sampleAddress: Address = {
  fullName: "Aishwarya R.",
  phone: "9876543210",
  email: "a@example.com",
  line1: "1 Anna Salai",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600002",
  country: "IN",
};

const sampleShipping: ShippingOption = {
  id: "std",
  name: "Standard delivery",
  etaDays: 5,
  pricePaise: 8000,
};

const sampleItems: OrderItem[] = [
  {
    productId: "p1",
    productSlug: "p1-slug",
    productName: "Amrita Kanjivaram",
    variantSku: "amrita-maroon",
    variantLabel: "Maroon",
    imageUrl: "https://x/y.jpg",
    unitPricePaise: 4250000,
    quantity: 1,
    lineTotalPaise: 4250000,
  },
];

describe("ordersRepo (mock)", () => {
  beforeEach(() => __resetOrdersRepo());

  it("creates an order and returns it by id", async () => {
    const order = await ordersRepo.create({
      userId: null,
      guestSessionId: "gs_x",
      items: sampleItems,
      subtotalPaise: 4250000,
      shippingPaise: 8000,
      taxPaise: 212500,
      totalPaise: 4470500,
      paymentMethod: "razorpay",
      shippingAddress: sampleAddress,
      shippingOption: sampleShipping,
    });

    expect(order.id).toMatch(/^ord_/);
    expect(order.status).toBe("confirmed");
    expect(order.paymentStatus).toBe("pending");

    const fetched = await ordersRepo.getById(order.id);
    expect(fetched?.id).toBe(order.id);
  });

  it("returns null for unknown order id", async () => {
    expect(await ordersRepo.getById("ord_does_not_exist")).toBeNull();
  });

  it("lists orders for a guest session", async () => {
    await ordersRepo.create({
      userId: null,
      guestSessionId: "gs_alpha",
      items: sampleItems,
      subtotalPaise: 4250000,
      shippingPaise: 8000,
      taxPaise: 212500,
      totalPaise: 4470500,
      paymentMethod: "cod",
      shippingAddress: sampleAddress,
      shippingOption: sampleShipping,
    });
    const list = await ordersRepo.listByGuestSession("gs_alpha");
    expect(list).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run, confirm 3 failing**

```powershell
npx vitest run src/lib/db/repos/orders.test.ts
```

- [ ] **Step 3: Implement `src/lib/db/repos/orders.ts`**

```ts
import { nanoid } from "nanoid";
import type { Address, Order, OrderItem, PaymentMethod, ShippingOption } from "@/types/domain";

export interface CreateOrderInput {
  userId: string | null;
  guestSessionId: string | null;
  items: OrderItem[];
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  shippingOption: ShippingOption;
  customerNotes?: string;
}

export interface OrdersRepo {
  create(input: CreateOrderInput): Promise<Order>;
  getById(id: string): Promise<Order | null>;
  listByGuestSession(guestSessionId: string): Promise<Order[]>;
}

const orders = new Map<string, Order>();

function nowIso(): string {
  return new Date().toISOString();
}

export const ordersRepo: OrdersRepo = {
  async create(input) {
    const now = nowIso();
    const order: Order = {
      id: `ord_${nanoid(12)}`,
      userId: input.userId,
      guestSessionId: input.guestSessionId,
      items: input.items,
      subtotalPaise: input.subtotalPaise,
      shippingPaise: input.shippingPaise,
      taxPaise: input.taxPaise,
      totalPaise: input.totalPaise,
      // Both COD and Razorpay land at "confirmed" with paymentStatus "pending"
      // here — Phase 5 will introduce true paid/payment_failed transitions.
      status: "confirmed",
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      shippingAddress: input.shippingAddress,
      shippingOption: input.shippingOption,
      customerNotes: input.customerNotes,
      createdAt: now,
      updatedAt: now,
    };
    orders.set(order.id, order);
    return order;
  },

  async getById(id) {
    return orders.get(id) ?? null;
  },

  async listByGuestSession(guestSessionId) {
    return [...orders.values()]
      .filter((o) => o.guestSessionId === guestSessionId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
};

export function __resetOrdersRepo(): void {
  orders.clear();
}
```

- [ ] **Step 4: Run, confirm 3 passing**

```powershell
npx vitest run src/lib/db/repos/orders.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/lib/db/repos/orders.ts src/lib/db/repos/orders.test.ts
git commit -m "feat(repos): add mock ordersRepo with create/getById/listByGuestSession"
```

---

## Task 8: Cart Server Actions

**Files:** `src/server/actions/cart.ts`, `src/server/actions/cart.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetCartRepo, cartRepo } from "@/lib/db/repos/cart";
import { addToCartAction, removeCartItemAction, updateCartItemAction } from "./cart";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/cart/guest-session", () => ({
  ensureGuestSessionId: vi.fn(async () => "gs_action_test"),
  getGuestSessionId: vi.fn(async () => "gs_action_test"),
}));

describe("cart server actions", () => {
  beforeEach(() => __resetCartRepo());

  it("addToCartAction adds an item using the current guest session", async () => {
    await addToCartAction({
      productId: "p",
      productSlug: "p-slug",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 2,
    });
    const cart = await cartRepo.getOrCreateForGuestSession("gs_action_test");
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(2);
  });

  it("updateCartItemAction updates quantity", async () => {
    await addToCartAction({
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 1,
    });
    let cart = await cartRepo.getOrCreateForGuestSession("gs_action_test");
    const itemId = cart.items[0]!.id;
    await updateCartItemAction(itemId, 3);
    cart = await cartRepo.getOrCreateForGuestSession("gs_action_test");
    expect(cart.items[0]?.quantity).toBe(3);
  });

  it("removeCartItemAction removes an item", async () => {
    await addToCartAction({
      productId: "p",
      productSlug: "p",
      productName: "P",
      variantSku: "sku",
      variantLabel: "Color",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 1,
    });
    let cart = await cartRepo.getOrCreateForGuestSession("gs_action_test");
    const itemId = cart.items[0]!.id;
    await removeCartItemAction(itemId);
    cart = await cartRepo.getOrCreateForGuestSession("gs_action_test");
    expect(cart.items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run, confirm 3 failing**

```powershell
npx vitest run src/server/actions/cart.test.ts
```

- [ ] **Step 3: Implement `src/server/actions/cart.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { ensureGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo, type AddItemInput } from "@/lib/db/repos/cart";

export async function addToCartAction(input: AddItemInput): Promise<void> {
  const guestSessionId = await ensureGuestSessionId();
  await cartRepo.addItem(guestSessionId, input);
  revalidatePath("/", "layout");
}

export async function updateCartItemAction(itemId: string, quantity: number): Promise<void> {
  const guestSessionId = await ensureGuestSessionId();
  await cartRepo.updateQuantity(guestSessionId, itemId, quantity);
  revalidatePath("/", "layout");
}

export async function removeCartItemAction(itemId: string): Promise<void> {
  const guestSessionId = await ensureGuestSessionId();
  await cartRepo.removeItem(guestSessionId, itemId);
  revalidatePath("/", "layout");
}

export async function clearCartAction(): Promise<void> {
  const guestSessionId = await ensureGuestSessionId();
  await cartRepo.clear(guestSessionId);
  revalidatePath("/", "layout");
}
```

- [ ] **Step 4: Run, confirm 3 passing**

```powershell
npx vitest run src/server/actions/cart.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/server/actions/cart.ts src/server/actions/cart.test.ts
git commit -m "feat(actions): add cart server actions (add/update/remove/clear)"
```

---

## Task 9: Input + FormField primitives

**Files:** `src/components/ui/Input.tsx`, `src/components/ui/FormField.tsx`

- [ ] **Step 1: Create `src/components/ui/Input.tsx`**

```tsx
import { forwardRef } from "react";
import { clsx } from "@/lib/utils/clsx";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid ? "true" : undefined}
      className={clsx(
        "h-11 w-full rounded-sm border bg-bg-elevated px-3 text-base text-ink-900 transition placeholder:text-ink-500",
        "focus:border-accent-primary focus:outline-none",
        invalid ? "border-danger focus:border-danger" : "border-ink-500/30",
        className,
      )}
      {...rest}
    />
  );
});
```

- [ ] **Step 2: Create `src/components/ui/FormField.tsx`**

```tsx
import type { ReactNode } from "react";
import { clsx } from "@/lib/utils/clsx";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wide text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <span className="text-xs text-danger" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-ink-500">{hint}</span>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/ui/Input.tsx src/components/ui/FormField.tsx
git commit -m "feat(ui): add Input and FormField primitives"
```

---

## Task 10: AddToCartButton — accept onAdd handler

**File:** modify `src/components/ui/AddToCartButton.tsx`

Phase 2 made it a toast-only stub. Phase 3 wires it to the real Server Action. The button now accepts an optional `onAdd` handler instead of hard-coding the toast call.

- [ ] **Step 1: Replace `src/components/ui/AddToCartButton.tsx`**

```tsx
"use client";

import { useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";

export interface AddToCartButtonProps {
  productName: string;
  variantSku: string | null;
  quantity: number;
  onAdd: (input: { variantSku: string; quantity: number }) => Promise<void> | void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function AddToCartButton({
  productName,
  variantSku,
  quantity,
  onAdd,
  disabled,
  fullWidth,
  className,
}: AddToCartButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!variantSku) {
      toast.error("Please choose a variant before adding to cart.");
      return;
    }
    startTransition(async () => {
      try {
        await onAdd({ variantSku, quantity });
        toast.success(`Added ${quantity} × ${productName} to cart`, {
          action: { label: "View cart", onClick: () => (window.location.href = "/cart") },
        });
      } catch (err) {
        toast.error("Couldn't add to cart. Please try again.");
        console.error(err);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={handleClick}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition",
        "hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        fullWidth && "w-full",
        className,
      )}
    >
      <ShoppingBag className="h-4 w-4" />
      {pending ? "Adding…" : "Add to cart"}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/ui/AddToCartButton.tsx
git commit -m "feat(ui): AddToCartButton accepts onAdd handler and shows pending state"
```

---

## Task 11: Wire ProductBuyBox to addToCartAction

**File:** modify `src/components/storefront/ProductBuyBox.tsx`

- [ ] **Step 1: Replace the file**

```tsx
"use client";

import { useState } from "react";
import { addToCartAction } from "@/server/actions/cart";
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
  const primaryImage = product.images[0]?.url ?? "";

  async function handleAdd({ variantSku, quantity }: { variantSku: string; quantity: number }) {
    if (!selectedVariant) return;
    await addToCartAction({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantSku,
      variantLabel: selectedVariant.size
        ? `${selectedVariant.colorName} · ${selectedVariant.size}`
        : selectedVariant.colorName,
      imageUrl: primaryImage,
      unitPricePaise: product.priceInPaise,
      unitMrpPaise: product.mrpInPaise,
      quantity,
    });
  }

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
          onAdd={handleAdd}
          disabled={!inStock}
          fullWidth
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```powershell
npx next build
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/storefront/ProductBuyBox.tsx
git commit -m "feat(product): wire ProductBuyBox to addToCartAction server action"
```

---

## Task 12: CartLineItem + CartSummary

**Files:** `src/components/storefront/CartLineItem.tsx`, `src/components/storefront/CartSummary.tsx`

- [ ] **Step 1: Create `CartLineItem.tsx`**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatRupees } from "@/lib/money";
import { removeCartItemAction, updateCartItemAction } from "@/server/actions/cart";
import { IconButton } from "@/components/ui/IconButton";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { CartItem } from "@/types/domain";

export function CartLineItem({ item }: { item: CartItem }) {
  const [pending, startTransition] = useTransition();
  const lineTotalPaise = item.unitPricePaise * item.quantity;

  function changeQty(next: number) {
    startTransition(async () => {
      try {
        await updateCartItemAction(item.id, next);
      } catch (err) {
        toast.error("Couldn't update quantity.");
        console.error(err);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        await removeCartItemAction(item.id);
        toast.success(`Removed ${item.productName}`);
      } catch (err) {
        toast.error("Couldn't remove item.");
        console.error(err);
      }
    });
  }

  return (
    <div className="flex gap-4 py-6">
      <Link
        href={`/product/${item.productSlug}`}
        className="relative h-28 w-24 shrink-0 overflow-hidden rounded-sm bg-ink-500/5"
      >
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            fill
            sizes="96px"
            className="object-cover"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/product/${item.productSlug}`}
              className="font-display text-lg text-ink-900 transition hover:text-accent-primary"
            >
              {item.productName}
            </Link>
            <span className="text-xs uppercase tracking-wide text-ink-500">
              {item.variantLabel}
            </span>
          </div>
          <IconButton aria-label="Remove" onClick={remove} disabled={pending}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper value={item.quantity} onChange={changeQty} min={1} max={10} />
          <span className="text-base font-semibold tabular-nums text-ink-900">
            {formatRupees(lineTotalPaise)}
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `CartSummary.tsx`**

```tsx
import { formatRupees } from "@/lib/money";

export interface CartSummaryProps {
  subtotalPaise: number;
  shippingPaise?: number;
  taxPaise: number;
  totalPaise: number;
  className?: string;
}

export function CartSummary({
  subtotalPaise,
  shippingPaise,
  taxPaise,
  totalPaise,
  className,
}: CartSummaryProps) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-3 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-2xl text-ink-900">Order summary</h2>
        <dl className="flex flex-col gap-2 text-sm text-ink-700">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatRupees(subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>GST (5%)</dt>
            <dd className="tabular-nums">{formatRupees(taxPaise)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className="tabular-nums">
              {typeof shippingPaise === "number"
                ? shippingPaise === 0
                  ? "Free"
                  : formatRupees(shippingPaise)
                : "Calculated at checkout"}
            </dd>
          </div>
        </dl>
        <div className="mt-2 flex justify-between border-t border-ink-500/10 pt-3 font-display text-xl text-ink-900">
          <span>Total</span>
          <span className="tabular-nums">{formatRupees(totalPaise)}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/storefront/CartLineItem.tsx src/components/storefront/CartSummary.tsx
git commit -m "feat(storefront): add CartLineItem and CartSummary"
```

---

## Task 13: CartDrawer + CartTrigger

**Files:** `src/components/storefront/CartDrawer.tsx`, `src/components/storefront/CartTrigger.tsx`

- [ ] **Step 1: Create `CartDrawer.tsx`**

```tsx
"use client";

import Link from "next/link";
import { formatRupees } from "@/lib/money";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Sheet";
import type { Cart } from "@/types/domain";
import { CartLineItem } from "./CartLineItem";

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: Cart;
  subtotalPaise: number;
}

export function CartDrawer({ open, onClose, cart, subtotalPaise }: CartDrawerProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Cart (${cart.items.length})`}
      side="right"
      footer={
        cart.items.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm text-ink-700">
              <span>Subtotal</span>
              <span className="font-semibold tabular-nums text-ink-900">
                {formatRupees(subtotalPaise)}
              </span>
            </div>
            <p className="text-xs text-ink-500">GST and shipping are added at checkout.</p>
            <div className="flex gap-2">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex-1 rounded-sm border border-ink-900 px-4 py-3 text-center text-sm font-medium text-ink-900 transition hover:bg-ink-900 hover:text-white"
              >
                View cart
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex-1 rounded-sm bg-accent-primary px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-accent-primary-hover"
              >
                Checkout
              </Link>
            </div>
          </div>
        ) : null
      }
    >
      {cart.items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Add a saree from the shop to begin."
          action={
            <Link
              href="/shop"
              onClick={onClose}
              className="mt-2 inline-flex items-center justify-center rounded-sm bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
            >
              Shop sarees
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-ink-500/10">
          {cart.items.map((item) => (
            <li key={item.id}>
              <CartLineItem item={item} />
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
```

- [ ] **Step 2: Create `CartTrigger.tsx`**

```tsx
"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import type { Cart } from "@/types/domain";
import { CartDrawer } from "./CartDrawer";

export interface CartTriggerProps {
  cart: Cart;
  subtotalPaise: number;
}

export function CartTrigger({ cart, subtotalPaise }: CartTriggerProps) {
  const [open, setOpen] = useState(false);
  const count = cart.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      <div className="relative">
        <IconButton aria-label="Cart" size="sm" onClick={() => setOpen(true)}>
          <ShoppingBag className="h-5 w-5" />
        </IconButton>
        {count > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-semibold tabular-nums text-white"
          >
            {count}
          </span>
        )}
      </div>
      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
        cart={cart}
        subtotalPaise={subtotalPaise}
      />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/storefront/CartDrawer.tsx src/components/storefront/CartTrigger.tsx
git commit -m "feat(storefront): add CartDrawer and CartTrigger (cart icon + badge + drawer)"
```

---

## Task 14: Update Header to use CartTrigger

**File:** modify `src/components/shared/Header.tsx`

> **Important — Next 16 cookie semantics:** Server Components can only _read_ cookies; writing requires a Server Action or Route Handler. The `Header` (and the `/cart` and `/checkout` pages below) therefore use the read-only `getGuestSessionId()` and gracefully handle the "no cookie yet" case. The cookie is created on first call to `ensureGuestSessionId()` inside a Server Action (e.g. `addToCartAction`), which DOES support `cookies().set()`. After `revalidatePath()` re-renders the layout, the Header sees the new cookie on the very next render.

- [ ] **Step 1: Replace the file**

```tsx
import Link from "next/link";
import { Heart, Menu, Search, User } from "lucide-react";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { computeSubtotalPaise } from "@/lib/cart/totals";
import { cartRepo } from "@/lib/db/repos/cart";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { CartTrigger } from "@/components/storefront/CartTrigger";
import { Container } from "@/components/ui/Container";
import { IconButton } from "@/components/ui/IconButton";
import type { Cart } from "@/types/domain";

async function readCart(): Promise<Cart> {
  const guestSessionId = await getGuestSessionId();
  if (!guestSessionId) {
    return {
      id: "cart_empty",
      userId: null,
      guestSessionId: null,
      items: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return cartRepo.getOrCreateForGuestSession(guestSessionId);
}

export async function Header() {
  const [categories, cart] = await Promise.all([categoriesRepo.listTopLevel(), readCart()]);
  const subtotalPaise = computeSubtotalPaise(cart.items);

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
            <CartTrigger cart={cart} subtotalPaise={subtotalPaise} />
          </div>
        </div>
      </Container>
    </header>
  );
}
```

- [ ] **Step 2: Verify build**

```powershell
npx next build
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/shared/Header.tsx
git commit -m "feat(shared): use CartTrigger in Header with live cart count"
```

---

## Task 15: /cart page

**File:** `src/app/(storefront)/cart/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from "next/link";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise } from "@/lib/cart/totals";
import { cartRepo } from "@/lib/db/repos/cart";
import { CartLineItem } from "@/components/storefront/CartLineItem";
import { CartSummary } from "@/components/storefront/CartSummary";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Cart · Saree Store",
};

export default async function CartPage() {
  const guestSessionId = await getGuestSessionId();
  const cart = guestSessionId
    ? await cartRepo.getOrCreateForGuestSession(guestSessionId)
    : { id: "cart_empty", userId: null, guestSessionId: null, items: [], updatedAt: "" };
  const subtotalPaise = computeSubtotalPaise(cart.items);
  const taxPaise = computeTaxPaise(subtotalPaise);
  const totalPaise = computeTotalPaise({ subtotalPaise, taxPaise, shippingPaise: 0 });

  return (
    <Container size="xl" className="py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
      <h1 className="mt-6 font-display text-3xl text-ink-900 md:text-5xl">Your cart</h1>

      {cart.items.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            title="Your cart is empty"
            description="Find your next saree from the shop."
            action={
              <Link
                href="/shop"
                className="mt-2 inline-flex items-center justify-center rounded-sm bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
              >
                Shop sarees
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-12 md:grid-cols-[2fr_1fr]">
          <ul className="flex flex-col divide-y divide-ink-500/10">
            {cart.items.map((item) => (
              <li key={item.id}>
                <CartLineItem item={item} />
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-4 md:sticky md:top-24 md:self-start">
            <CartSummary
              subtotalPaise={subtotalPaise}
              taxPaise={taxPaise}
              totalPaise={totalPaise}
            />
            <Link
              href="/checkout"
              className="rounded-sm bg-accent-primary px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-accent-primary-hover"
            >
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}
```

- [ ] **Step 2: Build verify**

```powershell
npx next build
```

- [ ] **Step 3: Commit**

```powershell
git add "src/app/(storefront)/cart/page.tsx"
git commit -m "feat(cart): add /cart page"
```

---

## Task 16: AddressForm (RHF + Zod)

**File:** `src/components/checkout/AddressForm.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { INDIA_STATES } from "@/lib/cart/india-states";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Address } from "@/types/domain";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  email: z.email("Enter a valid email"),
  line1: z.string().min(5, "Required"),
  line2: z.string().optional(),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
});

export type AddressFormValues = z.infer<typeof schema>;

export interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (address: Address) => void;
  formId?: string;
}

export function AddressForm({ defaultValues, onSubmit, formId }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...defaultValues },
  });

  useEffect(() => {
    if (defaultValues) reset({ ...defaultValues });
  }, [defaultValues, reset]);

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((values) => onSubmit({ ...values, country: "IN" }))}
      className="grid gap-5 md:grid-cols-2"
    >
      <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <Input id="fullName" {...register("fullName")} invalid={!!errors.fullName} />
      </FormField>
      <FormField
        label="Mobile number"
        htmlFor="phone"
        required
        hint="10 digits, no spaces"
        error={errors.phone?.message}
      >
        <Input
          id="phone"
          inputMode="numeric"
          maxLength={10}
          {...register("phone")}
          invalid={!!errors.phone}
        />
      </FormField>
      <FormField
        label="Email"
        htmlFor="email"
        required
        className="md:col-span-2"
        error={errors.email?.message}
      >
        <Input id="email" type="email" {...register("email")} invalid={!!errors.email} />
      </FormField>
      <FormField
        label="Address line 1"
        htmlFor="line1"
        required
        className="md:col-span-2"
        error={errors.line1?.message}
      >
        <Input id="line1" {...register("line1")} invalid={!!errors.line1} />
      </FormField>
      <FormField
        label="Apartment, suite (optional)"
        htmlFor="line2"
        className="md:col-span-2"
        error={errors.line2?.message}
      >
        <Input id="line2" {...register("line2")} />
      </FormField>
      <FormField label="City" htmlFor="city" required error={errors.city?.message}>
        <Input id="city" {...register("city")} invalid={!!errors.city} />
      </FormField>
      <FormField label="Pincode" htmlFor="pincode" required error={errors.pincode?.message}>
        <Input
          id="pincode"
          inputMode="numeric"
          maxLength={6}
          {...register("pincode")}
          invalid={!!errors.pincode}
        />
      </FormField>
      <FormField
        label="State"
        htmlFor="state"
        required
        error={errors.state?.message}
        className="md:col-span-2"
      >
        <Select id="state" {...register("state")}>
          <option value="">Select a state</option>
          {INDIA_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </FormField>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/checkout/AddressForm.tsx
git commit -m "feat(checkout): add AddressForm with RHF + Zod validation"
```

---

## Task 17: ShippingOptionPicker + PaymentMethodPicker

**Files:** `src/components/checkout/ShippingOptionPicker.tsx`, `src/components/checkout/PaymentMethodPicker.tsx`

- [ ] **Step 1: Create `ShippingOptionPicker.tsx`**

```tsx
"use client";

import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import type { ShippingOption } from "@/types/domain";

export interface ShippingOptionPickerProps {
  options: ShippingOption[];
  selectedId: string | null;
  onChange: (option: ShippingOption) => void;
}

export function ShippingOptionPicker({ options, selectedId, onChange }: ShippingOptionPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => {
        const active = opt.id === selectedId;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt)}
            className={clsx(
              "flex w-full items-start justify-between gap-4 rounded-sm border p-4 text-left transition",
              active
                ? "border-accent-primary bg-accent-primary/5"
                : "border-ink-500/20 hover:border-ink-700",
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-ink-900">{opt.name}</span>
              <span className="text-xs text-ink-500">Delivered in {opt.etaDays} business days</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-ink-900">
              {opt.pricePaise === 0 ? "Free" : formatRupees(opt.pricePaise)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create `PaymentMethodPicker.tsx`**

```tsx
"use client";

import { clsx } from "@/lib/utils/clsx";
import type { PaymentMethod } from "@/types/domain";

export interface PaymentMethodPickerProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const OPTIONS: { value: PaymentMethod; label: string; description: string }[] = [
  {
    value: "razorpay",
    label: "Pay online",
    description: "UPI, cards, netbanking, wallets (via Razorpay) — stubbed for this preview.",
  },
  {
    value: "cod",
    label: "Cash on delivery",
    description: "Pay in cash when your saree is delivered.",
  },
];

export function PaymentMethodPicker({ selected, onChange }: PaymentMethodPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      {OPTIONS.map((opt) => {
        const active = opt.value === selected;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              "flex w-full flex-col items-start gap-1 rounded-sm border p-4 text-left transition",
              active
                ? "border-accent-primary bg-accent-primary/5"
                : "border-ink-500/20 hover:border-ink-700",
            )}
          >
            <span className="text-sm font-medium text-ink-900">{opt.label}</span>
            <span className="text-xs text-ink-500">{opt.description}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/checkout/ShippingOptionPicker.tsx src/components/checkout/PaymentMethodPicker.tsx
git commit -m "feat(checkout): add ShippingOptionPicker and PaymentMethodPicker"
```

---

## Task 18: CheckoutStepper + CheckoutSummary

**Files:** `src/components/checkout/CheckoutStepper.tsx`, `src/components/checkout/CheckoutSummary.tsx`

- [ ] **Step 1: Create `CheckoutStepper.tsx`**

```tsx
import { Check } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export type CheckoutStepId = "address" | "shipping" | "payment";

export interface CheckoutStepperProps {
  current: CheckoutStepId;
  completed: CheckoutStepId[];
}

const STEPS: { id: CheckoutStepId; label: string; index: number }[] = [
  { id: "address", label: "Address", index: 1 },
  { id: "shipping", label: "Shipping", index: 2 },
  { id: "payment", label: "Payment", index: 3 },
];

export function CheckoutStepper({ current, completed }: CheckoutStepperProps) {
  return (
    <ol className="flex items-center gap-3">
      {STEPS.map((step, idx) => {
        const isCurrent = step.id === current;
        const isDone = completed.includes(step.id) && !isCurrent;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-3">
            <div
              className={clsx(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                isDone
                  ? "border-accent-primary bg-accent-primary text-white"
                  : isCurrent
                    ? "border-ink-900 text-ink-900"
                    : "border-ink-500/30 text-ink-500",
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : step.index}
            </div>
            <span
              className={clsx(
                "text-xs uppercase tracking-wide",
                isCurrent ? "text-ink-900" : "text-ink-500",
              )}
            >
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <span className="hidden flex-1 border-t border-ink-500/20 md:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Create `CheckoutSummary.tsx`**

```tsx
import Image from "next/image";
import { formatRupees } from "@/lib/money";
import { CartSummary } from "@/components/storefront/CartSummary";
import type { Cart } from "@/types/domain";

export interface CheckoutSummaryProps {
  cart: Cart;
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
}

export function CheckoutSummary({
  cart,
  subtotalPaise,
  shippingPaise,
  taxPaise,
  totalPaise,
}: CheckoutSummaryProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="mb-4 font-display text-2xl text-ink-900">In your cart</h2>
        <ul className="flex flex-col gap-4">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm bg-ink-500/5">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col text-sm">
                <span className="font-medium text-ink-900">{item.productName}</span>
                <span className="text-xs text-ink-500">
                  {item.variantLabel} · Qty {item.quantity}
                </span>
                <span className="mt-1 font-semibold tabular-nums text-ink-900">
                  {formatRupees(item.unitPricePaise * item.quantity)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <CartSummary
        subtotalPaise={subtotalPaise}
        shippingPaise={shippingPaise}
        taxPaise={taxPaise}
        totalPaise={totalPaise}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/checkout/CheckoutStepper.tsx src/components/checkout/CheckoutSummary.tsx
git commit -m "feat(checkout): add CheckoutStepper and CheckoutSummary"
```

---

## Task 19: placeOrder server action (TDD)

**Files:** `src/server/actions/orders.ts`, `src/server/actions/orders.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetCartRepo, cartRepo } from "@/lib/db/repos/cart";
import { __resetOrdersRepo, ordersRepo } from "@/lib/db/repos/orders";
import type { Address, ShippingOption } from "@/types/domain";
import { placeOrderAction } from "./orders";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const redirectMock = vi.fn((_: string) => {
  throw new Error("NEXT_REDIRECT");
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));

vi.mock("@/lib/cart/guest-session", () => ({
  ensureGuestSessionId: vi.fn(async () => "gs_order_test"),
  getGuestSessionId: vi.fn(async () => "gs_order_test"),
}));

const address: Address = {
  fullName: "Aishwarya R.",
  phone: "9876543210",
  email: "a@example.com",
  line1: "1 Anna Salai",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600002",
  country: "IN",
};

const shipping: ShippingOption = {
  id: "std",
  name: "Standard delivery",
  etaDays: 5,
  pricePaise: 8000,
};

describe("placeOrderAction", () => {
  beforeEach(() => {
    __resetCartRepo();
    __resetOrdersRepo();
    redirectMock.mockClear();
  });

  it("snapshots the cart into an order and clears the cart", async () => {
    await cartRepo.addItem("gs_order_test", {
      productId: "p",
      productSlug: "p",
      productName: "Amrita",
      variantSku: "sku",
      variantLabel: "Maroon",
      imageUrl: "https://x/y.jpg",
      unitPricePaise: 100000,
      unitMrpPaise: 120000,
      quantity: 2,
    });

    await expect(
      placeOrderAction({
        shippingAddress: address,
        shippingOption: shipping,
        paymentMethod: "cod",
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const cartAfter = await cartRepo.getOrCreateForGuestSession("gs_order_test");
    expect(cartAfter.items).toHaveLength(0);

    const all = await ordersRepo.listByGuestSession("gs_order_test");
    expect(all).toHaveLength(1);
    const order = all[0]!;
    expect(order.items[0]?.quantity).toBe(2);
    expect(order.subtotalPaise).toBe(200000);
    expect(order.taxPaise).toBe(10000);
    expect(order.shippingPaise).toBe(8000);
    expect(order.totalPaise).toBe(218000);
    expect(order.paymentMethod).toBe("cod");

    expect(redirectMock).toHaveBeenCalledWith(`/checkout/success/${order.id}`);
  });

  it("throws when the cart is empty", async () => {
    await expect(
      placeOrderAction({
        shippingAddress: address,
        shippingOption: shipping,
        paymentMethod: "razorpay",
      }),
    ).rejects.toThrow(/empty/i);
  });
});
```

- [ ] **Step 2: Run, confirm 2 failing**

```powershell
npx vitest run src/server/actions/orders.test.ts
```

- [ ] **Step 3: Implement `src/server/actions/orders.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureGuestSessionId } from "@/lib/cart/guest-session";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise } from "@/lib/cart/totals";
import { cartRepo } from "@/lib/db/repos/cart";
import { ordersRepo } from "@/lib/db/repos/orders";
import type { Address, OrderItem, PaymentMethod, ShippingOption } from "@/types/domain";

export interface PlaceOrderInput {
  shippingAddress: Address;
  shippingOption: ShippingOption;
  paymentMethod: PaymentMethod;
  customerNotes?: string;
}

export async function placeOrderAction(input: PlaceOrderInput): Promise<void> {
  const guestSessionId = await ensureGuestSessionId();
  const cart = await cartRepo.getOrCreateForGuestSession(guestSessionId);

  if (cart.items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const items: OrderItem[] = cart.items.map((i) => ({
    productId: i.productId,
    productSlug: i.productSlug,
    productName: i.productName,
    variantSku: i.variantSku,
    variantLabel: i.variantLabel,
    imageUrl: i.imageUrl,
    unitPricePaise: i.unitPricePaise,
    quantity: i.quantity,
    lineTotalPaise: i.unitPricePaise * i.quantity,
  }));

  const subtotalPaise = computeSubtotalPaise(cart.items);
  const taxPaise = computeTaxPaise(subtotalPaise);
  const shippingPaise = input.shippingOption.pricePaise;
  const totalPaise = computeTotalPaise({ subtotalPaise, taxPaise, shippingPaise });

  const order = await ordersRepo.create({
    userId: null,
    guestSessionId,
    items,
    subtotalPaise,
    shippingPaise,
    taxPaise,
    totalPaise,
    paymentMethod: input.paymentMethod,
    shippingAddress: input.shippingAddress,
    shippingOption: input.shippingOption,
    customerNotes: input.customerNotes,
  });

  await cartRepo.clear(guestSessionId);
  revalidatePath("/", "layout");
  redirect(`/checkout/success/${order.id}`);
}
```

- [ ] **Step 4: Run, confirm 2 passing**

```powershell
npx vitest run src/server/actions/orders.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/server/actions/orders.ts src/server/actions/orders.test.ts
git commit -m "feat(actions): add placeOrderAction (snapshot cart, create order, redirect)"
```

---

## Task 20: CheckoutFlow client island

**File:** `src/components/checkout/CheckoutFlow.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { getShippingOptions } from "@/lib/cart/shipping";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise } from "@/lib/cart/totals";
import { placeOrderAction } from "@/server/actions/orders";
import { Container } from "@/components/ui/Container";
import type { Address, Cart, PaymentMethod, ShippingOption } from "@/types/domain";
import { AddressForm, type AddressFormValues } from "./AddressForm";
import { CheckoutStepper, type CheckoutStepId } from "./CheckoutStepper";
import { CheckoutSummary } from "./CheckoutSummary";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { ShippingOptionPicker } from "./ShippingOptionPicker";

export function CheckoutFlow({ cart }: { cart: Cart }) {
  const subtotalPaise = computeSubtotalPaise(cart.items);
  const taxPaise = computeTaxPaise(subtotalPaise);
  const shippingOptions = getShippingOptions(subtotalPaise);

  const [step, setStep] = useState<CheckoutStepId>("address");
  const [completed, setCompleted] = useState<CheckoutStepId[]>([]);
  const [address, setAddress] = useState<Address | null>(null);
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(
    shippingOptions[0] ?? null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [pending, startTransition] = useTransition();

  const shippingPaise = shippingOption?.pricePaise ?? 0;
  const totalPaise = computeTotalPaise({ subtotalPaise, taxPaise, shippingPaise });

  function onAddressSubmit(values: AddressFormValues) {
    setAddress({ ...values, country: "IN" });
    setCompleted((c) => Array.from(new Set([...c, "address"])));
    setStep("shipping");
  }

  function onShippingNext() {
    if (!shippingOption) {
      toast.error("Please choose a shipping option.");
      return;
    }
    setCompleted((c) => Array.from(new Set([...c, "shipping"])));
    setStep("payment");
  }

  function onPlaceOrder() {
    if (!address || !shippingOption) {
      toast.error("Please complete address and shipping first.");
      return;
    }
    startTransition(async () => {
      try {
        await placeOrderAction({
          shippingAddress: address,
          shippingOption,
          paymentMethod,
        });
      } catch (err) {
        // redirect throws NEXT_REDIRECT — that's success, not an error.
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error("Couldn't place order. Please try again.");
        console.error(err);
      }
    });
  }

  return (
    <Container size="xl" className="py-6">
      <h1 className="mb-6 font-display text-3xl text-ink-900 md:text-5xl">Checkout</h1>
      <CheckoutStepper current={step} completed={completed} />

      <div className="mt-10 grid gap-12 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-10">
          {step === "address" && (
            <section>
              <h2 className="mb-4 font-display text-2xl text-ink-900">Delivery address</h2>
              <AddressForm
                defaultValues={address ?? undefined}
                onSubmit={onAddressSubmit}
                formId="address-form"
              />
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  form="address-form"
                  className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
                >
                  Continue to shipping
                </button>
              </div>
            </section>
          )}

          {step === "shipping" && (
            <section>
              <h2 className="mb-4 font-display text-2xl text-ink-900">Shipping</h2>
              <ShippingOptionPicker
                options={shippingOptions}
                selectedId={shippingOption?.id ?? null}
                onChange={setShippingOption}
              />
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="rounded-sm border border-ink-500/30 px-6 py-3 text-sm font-medium text-ink-700 transition hover:border-ink-900 hover:text-ink-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onShippingNext}
                  className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
                >
                  Continue to payment
                </button>
              </div>
            </section>
          )}

          {step === "payment" && (
            <section>
              <h2 className="mb-4 font-display text-2xl text-ink-900">Payment</h2>
              <PaymentMethodPicker selected={paymentMethod} onChange={setPaymentMethod} />
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep("shipping")}
                  className="rounded-sm border border-ink-500/30 px-6 py-3 text-sm font-medium text-ink-700 transition hover:border-ink-900 hover:text-ink-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onPlaceOrder}
                  disabled={pending}
                  className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? "Placing order…" : "Place order"}
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="md:sticky md:top-24 md:self-start">
          <CheckoutSummary
            cart={cart}
            subtotalPaise={subtotalPaise}
            shippingPaise={shippingPaise}
            taxPaise={taxPaise}
            totalPaise={totalPaise}
          />
        </div>
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/checkout/CheckoutFlow.tsx
git commit -m "feat(checkout): add CheckoutFlow (3-step accordion + place order)"
```

---

## Task 21: /checkout page

**File:** `src/app/(storefront)/checkout/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from "next/link";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo } from "@/lib/db/repos/cart";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Checkout · Saree Store",
};

export default async function CheckoutPage() {
  const guestSessionId = await getGuestSessionId();
  const cart = guestSessionId ? await cartRepo.getOrCreateForGuestSession(guestSessionId) : null;

  if (!cart || cart.items.length === 0) {
    return (
      <Container size="lg" className="py-20">
        <EmptyState
          title="Your cart is empty"
          description="Add a saree to begin checkout."
          action={
            <Link
              href="/shop"
              className="mt-2 inline-flex items-center justify-center rounded-sm bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
            >
              Shop sarees
            </Link>
          }
        />
      </Container>
    );
  }

  return <CheckoutFlow cart={cart} />;
}
```

- [ ] **Step 2: Build verify**

```powershell
npx next build
```

- [ ] **Step 3: Commit**

```powershell
git add "src/app/(storefront)/checkout/page.tsx"
git commit -m "feat(checkout): add /checkout page"
```

---

## Task 22: /checkout/success/[orderId] confirmation page

**File:** `src/app/(storefront)/checkout/success/[orderId]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Truck } from "lucide-react";
import { ordersRepo } from "@/lib/db/repos/orders";
import { formatRupees } from "@/lib/money";
import { CartSummary } from "@/components/storefront/CartSummary";
import { Container } from "@/components/ui/Container";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata = {
  title: "Order confirmed · Saree Store",
};

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = await ordersRepo.getById(orderId);
  if (!order) notFound();

  return (
    <Container size="md" className="py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <h1 className="font-display text-3xl text-ink-900 md:text-5xl">Thank you</h1>
        <p className="max-w-md text-ink-700">
          Your order <span className="font-medium text-ink-900">{order.id}</span> is confirmed. A
          summary has been emailed to {order.shippingAddress.email} (in real life — emails wire up
          in the email phase).
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <div className="flex items-start gap-3">
          <Truck className="mt-0.5 h-5 w-5 text-accent-gold" />
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink-900">{order.shippingOption.name}</span>
            <span className="text-ink-700">
              Estimated delivery in {order.shippingOption.etaDays} business days
            </span>
            <span className="text-ink-700">
              {order.shippingAddress.fullName}, {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""},{" "}
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.pincode}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[2fr_1fr]">
        <ul className="flex flex-col divide-y divide-ink-500/10">
          {order.items.map((item) => (
            <li key={item.variantSku} className="flex items-start gap-4 py-4">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-ink-500/5">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-medium text-ink-900">{item.productName}</span>
                <span className="text-xs text-ink-500">
                  {item.variantLabel} · Qty {item.quantity}
                </span>
                <span className="mt-1 font-semibold tabular-nums text-ink-900">
                  {formatRupees(item.lineTotalPaise)}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <CartSummary
          subtotalPaise={order.subtotalPaise}
          shippingPaise={order.shippingPaise}
          taxPaise={order.taxPaise}
          totalPaise={order.totalPaise}
        />
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link
          href="/shop"
          className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
        >
          Continue shopping
        </Link>
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Build verify**

```powershell
npx next build
```

Expected: `/checkout/success/[orderId]` route registered.

- [ ] **Step 3: Commit**

```powershell
git add "src/app/(storefront)/checkout/success/[orderId]/page.tsx"
git commit -m "feat(checkout): add order confirmation page"
```

---

## Task 23: E2E cart and checkout

**Files:** `tests/e2e/cart.spec.ts`, `tests/e2e/checkout.spec.ts`

- [ ] **Step 1: Create `tests/e2e/cart.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test.describe("Cart flow", () => {
  test("add a product to cart, see badge update, view cart page", async ({ page }) => {
    await page.goto("/product/amrita-kanjivaram");
    await page.getByRole("button", { name: /Add to cart/i }).click();
    // Toast: "Added 1 × Amrita Kanjivaram to cart"
    await expect(page.getByText(/Added \d+ × Amrita Kanjivaram to cart/)).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1, name: /Your cart/i })).toBeVisible();
    await expect(page.getByText("Amrita Kanjivaram")).toBeVisible();
  });

  test("update line quantity from cart page", async ({ page }) => {
    await page.goto("/product/kavya-linen");
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await expect(page.getByText(/Added \d+ × Kavya Linen to cart/)).toBeVisible();
    await page.goto("/cart");
    await page.getByRole("button", { name: "Increase quantity" }).first().click();
    // Quantity should now read 2 somewhere visibly
    await expect(page.locator("[aria-live='polite']").first()).toContainText("2");
  });

  test("empty cart shows empty state and link to shop", async ({ page }) => {
    // Use a unique storage state per test (Playwright default), so the cart starts empty.
    await page.goto("/cart");
    await expect(page.getByText(/Your cart is empty/)).toBeVisible();
  });
});
```

- [ ] **Step 2: Create `tests/e2e/checkout.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test.describe("Checkout flow", () => {
  test("place a COD order end-to-end", async ({ page }) => {
    // Seed cart
    await page.goto("/product/amrita-kanjivaram");
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await expect(page.getByText(/Added \d+ × Amrita Kanjivaram to cart/)).toBeVisible();

    await page.goto("/checkout");
    await expect(page.getByRole("heading", { level: 1, name: /Checkout/i })).toBeVisible();

    // Step 1: address
    await page.getByLabel(/Full name/i).fill("Aishwarya Ramaswamy");
    await page.getByLabel(/Mobile number/i).fill("9876543210");
    await page.getByLabel(/^Email/i).fill("aishwarya@example.com");
    await page.getByLabel(/Address line 1/i).fill("1 Anna Salai");
    await page.getByLabel(/^City/i).fill("Chennai");
    await page.getByLabel(/^Pincode/i).fill("600002");
    await page.getByLabel(/^State/i).selectOption("Tamil Nadu");
    await page.getByRole("button", { name: /Continue to shipping/i }).click();

    // Step 2: shipping
    await expect(page.getByRole("heading", { name: /Shipping/ })).toBeVisible();
    await page.getByRole("button", { name: /Continue to payment/i }).click();

    // Step 3: payment
    await page.getByRole("button", { name: /Cash on delivery/i }).click();
    await page.getByRole("button", { name: /Place order/i }).click();

    // Redirected to /checkout/success/<orderId>
    await expect(page).toHaveURL(/\/checkout\/success\/ord_/);
    await expect(page.getByRole("heading", { level: 1, name: /Thank you/i })).toBeVisible();
  });
});
```

- [ ] **Step 3: Run e2e**

```powershell
npm run e2e
```

If tests fail because the dev server's in-memory cart state persists between Playwright workers, narrow to a single worker or use Playwright's `test.describe.configure({ mode: "serial" })` inside each spec — adjust as needed and document any change. Each Playwright test uses a fresh browser context by default, which gets a fresh `gs_session` cookie, so cart state should be isolated per test.

- [ ] **Step 4: Commit**

```powershell
git add tests/e2e/cart.spec.ts tests/e2e/checkout.spec.ts
git commit -m "test(e2e): add cart and checkout flow tests"
```

---

## Task 24: Final verification + tag

- [ ] **Step 1: Full suite**

```powershell
npx prettier --check .
npx eslint .
npx tsc --noEmit
npx vitest run
npx next build
npm run e2e
```

- [ ] **Step 2: Tag**

```powershell
git tag -a phase-3-complete -m "Phase 3 (cart + checkout UI) complete"
```

---

## What's NOT in this phase

- **Auth** — Phase 4 (sign up / login / OTP). Cart is guest-only for now.
- **Cart merge on login** — Phase 4 (when login arrives).
- **Real Razorpay** — Phase 5 wires the SDK + signature verification.
- **Real shipping API** — Phase 7 (Shiprocket).
- **Real emails** — email phase.
- **Order history page** — Phase 5 (account UI).
- **Inventory checks at place-order time** — deferred until real DynamoDB inventory; the mock cart accepts any quantity.

## Spec coverage (§7–9)

- §7 cart: DB-backed (mock-DB) cart, guest cookie identification, line operations, server-side recompute of totals ✓. Cart merge on login: deferred to Phase 4. TTL 30 d: matches the cookie max-age; the mock has no eviction.
- §8 checkout: three-step accordion (Address / Shipping / Payment), sticky order summary, pincode validation via the address form (mock — real Shiprocket later) ✓. Atomic inventory reservation: deferred until real DDB.
- §9 payments: COD goes straight to `confirmed`; Razorpay flow short-circuits to `confirmed` with `paymentStatus=pending` for now. Real payment + webhook verification: Phase 5.
