# Phase 5 — Account UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the customer account experience — sidebar-navigated dashboard with order history (list + detail with status timeline), address book CRUD, profile + password change, wishlist, plus the cart/order integration tightening that follows from being logged in. Real persistence still in mock repos; no AWS yet.

**Architecture:** Reuses Phases 1–4. Adds `savedAddressesRepo` and `wishlistRepo` mock repositories (globalThis-backed for dev-mode persistence). The cart Server Actions and `placeOrderAction` learn to prefer the user cart when a session is present, falling back to the guest cart cookie. `ordersRepo` gains a `listByUser` access pattern. An `(account)` sub-layout under `(storefront)` paints the persistent left sidebar and routes `/account`, `/account/orders`, `/account/orders/[orderId]`, `/account/addresses`, `/account/profile`, `/account/wishlist` through it. All write actions live in `src/server/actions/` and revalidate `/` (layout) after success.

**Tech Stack:** Same as prior phases. RHF + Zod for forms. `sonner` for toasts.

**Reference spec:** `docs/superpowers/specs/2026-05-16-saree-ecom-design.md` §13.4 (Account section) and §5 (Addresses, Orders, Reviews).

---

## File Map

```
✎ src/types/domain.ts                                  # add SavedAddress, WishlistItem
✚ src/lib/db/repos/addresses.ts                        # mock SavedAddresses repo
✚ src/lib/db/repos/addresses.test.ts
✚ src/lib/db/repos/wishlist.ts                         # mock wishlist repo
✚ src/lib/db/repos/wishlist.test.ts
✎ src/lib/db/repos/orders.ts                            # add listByUser; preserve globalThis singleton
✎ src/lib/db/repos/orders.test.ts                       # tests for listByUser
✎ src/server/actions/cart.ts                            # prefer user cart when signed in
✎ src/server/actions/cart.test.ts                       # cover the user-cart branch
✎ src/server/actions/orders.ts                          # placeOrder: use user cart + set userId on order
✎ src/server/actions/orders.test.ts                     # cover the user branch
✚ src/server/actions/addresses.ts                       # CRUD address server actions
✚ src/server/actions/addresses.test.ts
✚ src/server/actions/wishlist.ts                        # add/remove wishlist actions
✚ src/server/actions/wishlist.test.ts
✚ src/server/actions/profile.ts                         # updateName + changePassword + 2 tests
✚ src/server/actions/profile.test.ts
✚ src/components/account/AccountShell.tsx              # sidebar + nav + signed-in info
✚ src/components/account/OrderStatusBadge.tsx
✚ src/components/account/OrderStatusTimeline.tsx
✚ src/components/account/OrderCard.tsx
✚ src/components/account/AddressCard.tsx
✚ src/components/account/SavedAddressForm.tsx          # RHF + Zod
✚ src/components/account/ProfileForm.tsx               # name update
✚ src/components/account/ChangePasswordForm.tsx        # current + new password
✚ src/components/account/WishlistGrid.tsx
✚ src/components/storefront/WishlistButton.tsx          # used on ProductCard + Product detail
✎ src/components/storefront/ProductCard.tsx             # add WishlistButton overlay
✚ src/app/(storefront)/(account)/layout.tsx            # wraps account routes
✎ src/app/(storefront)/account/page.tsx                # dashboard refactor (KPIs)
✚ src/app/(storefront)/account/orders/page.tsx
✚ src/app/(storefront)/account/orders/[orderId]/page.tsx
✚ src/app/(storefront)/account/addresses/page.tsx
✚ src/app/(storefront)/account/profile/page.tsx
✚ src/app/(storefront)/account/wishlist/page.tsx
✚ tests/e2e/account.spec.ts
```

Notes:

- `(account)` route group is wrapped inside `(storefront)` so it inherits the MarketingShell (Header + Footer).
- Addresses are scoped by `userId`. The one-shot `Address` type from Phase 3 (checkout snapshot) is unchanged; `SavedAddress` extends it with id, label, isDefault, timestamps.
- Wishlist holds a denormalised snapshot (name, image, price) so it doesn't break if a product gets deleted/renamed later.
- Cart and order Server Actions now have an "owner" concept (user > guest) — guest behaviour is preserved when no user is signed in.

---

## Task 1: Extend domain types

**File:** append to `src/types/domain.ts`.

- [ ] **Step 1: Append**

```ts
export interface SavedAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: "IN";
  label?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string;
  priceInPaise: number;
  mrpInPaise: number;
  addedAt: string;
}
```

- [ ] **Step 2: Typecheck + commit**

```powershell
npx tsc --noEmit
git add src/types/domain.ts
git commit -m "feat(types): add SavedAddress and WishlistItem types"
```

---

## Task 2: savedAddressesRepo (mock, TDD)

**Files:** `src/lib/db/repos/addresses.ts`, `src/lib/db/repos/addresses.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { __resetAddressesRepo, addressesRepo } from "./addresses";

const sample = {
  userId: "usr_x",
  fullName: "Aishwarya R.",
  phone: "9876543210",
  email: "a@example.com",
  line1: "1 Anna Salai",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600002",
  country: "IN" as const,
};

describe("addressesRepo (mock)", () => {
  beforeEach(() => __resetAddressesRepo());

  it("creates the first address as default automatically", async () => {
    const a = await addressesRepo.create(sample);
    expect(a.id).toMatch(/^addr_/);
    expect(a.isDefault).toBe(true);
  });

  it("subsequent creates are not default by default", async () => {
    await addressesRepo.create(sample);
    const b = await addressesRepo.create({ ...sample, line1: "2 Mount Rd" });
    expect(b.isDefault).toBe(false);
  });

  it("setDefault flips the flag and unsets the previous default", async () => {
    const a = await addressesRepo.create(sample);
    const b = await addressesRepo.create({ ...sample, line1: "2 Mount Rd" });
    await addressesRepo.setDefault("usr_x", b.id);
    const list = await addressesRepo.listByUser("usr_x");
    expect(list.find((x) => x.id === a.id)?.isDefault).toBe(false);
    expect(list.find((x) => x.id === b.id)?.isDefault).toBe(true);
  });

  it("updates an address", async () => {
    const a = await addressesRepo.create(sample);
    const updated = await addressesRepo.update(a.id, { label: "Home", city: "Mumbai" });
    expect(updated?.label).toBe("Home");
    expect(updated?.city).toBe("Mumbai");
  });

  it("deletes an address; if it was default, promotes another", async () => {
    const a = await addressesRepo.create(sample);
    const b = await addressesRepo.create({ ...sample, line1: "2 Mount Rd" });
    await addressesRepo.delete(a.id);
    const list = await addressesRepo.listByUser("usr_x");
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(b.id);
    expect(list[0]?.isDefault).toBe(true);
  });
});
```

- [ ] **Step 2: Run, confirm 5 failing**

- [ ] **Step 3: Implement `src/lib/db/repos/addresses.ts`**

```ts
import { nanoid } from "nanoid";
import type { SavedAddress } from "@/types/domain";

export interface CreateAddressInput extends Omit<
  SavedAddress,
  "id" | "isDefault" | "createdAt" | "updatedAt"
> {}

export interface UpdateAddressInput {
  fullName?: string;
  phone?: string;
  email?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  label?: string;
}

export interface AddressesRepo {
  listByUser(userId: string): Promise<SavedAddress[]>;
  getById(id: string): Promise<SavedAddress | null>;
  create(input: CreateAddressInput): Promise<SavedAddress>;
  update(id: string, input: UpdateAddressInput): Promise<SavedAddress | null>;
  delete(id: string): Promise<void>;
  setDefault(userId: string, id: string): Promise<void>;
}

declare global {
  // eslint-disable-next-line no-var
  var __mockAddresses: Map<string, SavedAddress> | undefined;
}

const addresses: Map<string, SavedAddress> =
  globalThis.__mockAddresses ?? (globalThis.__mockAddresses = new Map());

function nowIso(): string {
  return new Date().toISOString();
}

function listForUser(userId: string): SavedAddress[] {
  return [...addresses.values()]
    .filter((a) => a.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export const addressesRepo: AddressesRepo = {
  async listByUser(userId) {
    return listForUser(userId);
  },

  async getById(id) {
    return addresses.get(id) ?? null;
  },

  async create(input) {
    const userAddresses = listForUser(input.userId);
    const isFirst = userAddresses.length === 0;
    const now = nowIso();
    const address: SavedAddress = {
      id: `addr_${nanoid(12)}`,
      ...input,
      isDefault: isFirst,
      createdAt: now,
      updatedAt: now,
    };
    addresses.set(address.id, address);
    return address;
  },

  async update(id, input) {
    const a = addresses.get(id);
    if (!a) return null;
    Object.assign(a, input, { updatedAt: nowIso() });
    return a;
  },

  async delete(id) {
    const a = addresses.get(id);
    if (!a) return;
    const wasDefault = a.isDefault;
    addresses.delete(id);
    if (wasDefault) {
      const remaining = listForUser(a.userId);
      const promote = remaining[0];
      if (promote) {
        promote.isDefault = true;
        promote.updatedAt = nowIso();
      }
    }
  },

  async setDefault(userId, id) {
    for (const a of listForUser(userId)) {
      const shouldBeDefault = a.id === id;
      if (a.isDefault !== shouldBeDefault) {
        a.isDefault = shouldBeDefault;
        a.updatedAt = nowIso();
      }
    }
  },
};

export function __resetAddressesRepo(): void {
  addresses.clear();
}
```

- [ ] **Step 4: Run, confirm 5 passing + commit**

```powershell
npx vitest run src/lib/db/repos/addresses.test.ts
git add src/lib/db/repos/addresses.ts src/lib/db/repos/addresses.test.ts
git commit -m "feat(repos): add mock addressesRepo with default promotion"
```

---

## Task 3: wishlistRepo (mock, TDD)

**Files:** `src/lib/db/repos/wishlist.ts`, `src/lib/db/repos/wishlist.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { __resetWishlistRepo, wishlistRepo } from "./wishlist";

const sample = {
  userId: "usr_w",
  productId: "prd_a",
  productSlug: "p-a",
  productName: "Amrita",
  imageUrl: "https://x/y.jpg",
  priceInPaise: 100000,
  mrpInPaise: 120000,
};

describe("wishlistRepo (mock)", () => {
  beforeEach(() => __resetWishlistRepo());

  it("adds an item idempotently per (userId, productId)", async () => {
    await wishlistRepo.add(sample);
    await wishlistRepo.add(sample);
    const list = await wishlistRepo.listByUser("usr_w");
    expect(list).toHaveLength(1);
  });

  it("removes an item by productId", async () => {
    await wishlistRepo.add(sample);
    await wishlistRepo.remove("usr_w", "prd_a");
    expect(await wishlistRepo.listByUser("usr_w")).toEqual([]);
  });

  it("has() answers product membership", async () => {
    await wishlistRepo.add(sample);
    expect(await wishlistRepo.has("usr_w", "prd_a")).toBe(true);
    expect(await wishlistRepo.has("usr_w", "prd_other")).toBe(false);
  });
});
```

- [ ] **Step 2: Run, confirm 3 failing**

- [ ] **Step 3: Implement `src/lib/db/repos/wishlist.ts`**

```ts
import { nanoid } from "nanoid";
import type { WishlistItem } from "@/types/domain";

export interface AddWishlistInput {
  userId: string;
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string;
  priceInPaise: number;
  mrpInPaise: number;
}

export interface WishlistRepo {
  listByUser(userId: string): Promise<WishlistItem[]>;
  has(userId: string, productId: string): Promise<boolean>;
  add(input: AddWishlistInput): Promise<WishlistItem>;
  remove(userId: string, productId: string): Promise<void>;
}

declare global {
  // eslint-disable-next-line no-var
  var __mockWishlist: Map<string, WishlistItem> | undefined;
}

const items: Map<string, WishlistItem> =
  globalThis.__mockWishlist ?? (globalThis.__mockWishlist = new Map());

function key(userId: string, productId: string): string {
  return `${userId}#${productId}`;
}

export const wishlistRepo: WishlistRepo = {
  async listByUser(userId) {
    return [...items.values()]
      .filter((w) => w.userId === userId)
      .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
  },

  async has(userId, productId) {
    return items.has(key(userId, productId));
  },

  async add(input) {
    const k = key(input.userId, input.productId);
    const existing = items.get(k);
    if (existing) return existing;
    const item: WishlistItem = {
      id: `wl_${nanoid(12)}`,
      ...input,
      addedAt: new Date().toISOString(),
    };
    items.set(k, item);
    return item;
  },

  async remove(userId, productId) {
    items.delete(key(userId, productId));
  },
};

export function __resetWishlistRepo(): void {
  items.clear();
}
```

- [ ] **Step 4: Run + commit**

```powershell
npx vitest run src/lib/db/repos/wishlist.test.ts
git add src/lib/db/repos/wishlist.ts src/lib/db/repos/wishlist.test.ts
git commit -m "feat(repos): add mock wishlistRepo with idempotent add/remove"
```

---

## Task 4: ordersRepo — add listByUser

**Files:** modify `src/lib/db/repos/orders.ts`, `src/lib/db/repos/orders.test.ts`

- [ ] **Step 1: Append failing test inside the existing describe**

```ts
it("lists orders for a userId", async () => {
  await ordersRepo.create({
    userId: "usr_o1",
    guestSessionId: null,
    items: sampleItems,
    subtotalPaise: 4250000,
    shippingPaise: 8000,
    taxPaise: 212500,
    totalPaise: 4470500,
    paymentMethod: "razorpay",
    shippingAddress: sampleAddress,
    shippingOption: sampleShipping,
  });
  const list = await ordersRepo.listByUser("usr_o1");
  expect(list).toHaveLength(1);
  expect(list[0]?.userId).toBe("usr_o1");
});
```

- [ ] **Step 2: Run, confirm 1 failing**

- [ ] **Step 3: Extend `ordersRepo`**

In `src/lib/db/repos/orders.ts`, add to the `OrdersRepo` interface:

```ts
  listByUser(userId: string): Promise<Order[]>;
```

And in the implementation object, add:

```ts
  async listByUser(userId) {
    return [...orders.values()]
      .filter((o) => o.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
```

- [ ] **Step 4: Run + commit**

```powershell
npx vitest run src/lib/db/repos/orders.test.ts
git add src/lib/db/repos/orders.ts src/lib/db/repos/orders.test.ts
git commit -m "feat(repos): ordersRepo.listByUser access pattern"
```

---

## Task 5: Cart actions prefer user cart when signed in

**Files:** modify `src/server/actions/cart.ts`, `src/server/actions/cart.test.ts`

- [ ] **Step 1: Append failing test inside existing describe**

Add at the top of `cart.test.ts`, near the other `vi.mock` calls, mock `current-user`:

```ts
const getCurrentUserMock = vi.hoisted(() =>
  vi.fn<() => Promise<{ id: string } | null>>(async () => null),
);
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: getCurrentUserMock }));
```

Inside the describe block, before the closing brace, add:

```ts
it("addToCartAction targets the user cart when signed in", async () => {
  getCurrentUserMock.mockResolvedValueOnce({ id: "usr_cart" });
  await addToCartAction({
    productId: "p",
    productSlug: "p",
    productName: "P",
    variantSku: "sku",
    variantLabel: "Color",
    imageUrl: "https://x/y.jpg",
    unitPricePaise: 100000,
    unitMrpPaise: 120000,
    quantity: 2,
  });
  const userCart = await cartRepo.getOrCreateForUser("usr_cart");
  expect(userCart.items[0]?.quantity).toBe(2);
});
```

Also clear `getCurrentUserMock` in beforeEach: in the existing `beforeEach`, add `getCurrentUserMock.mockReset()` followed by `getCurrentUserMock.mockResolvedValue(null)` to keep the previous tests' default behaviour.

- [ ] **Step 2: Run, confirm new test failing**

- [ ] **Step 3: Update `src/server/actions/cart.ts`**

Replace the existing actions with the user-aware versions:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ensureGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo, type AddItemInput } from "@/lib/db/repos/cart";

export async function addToCartAction(input: AddItemInput): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await cartRepo.addItemAsUser(user.id, input);
  } else {
    const guestSessionId = await ensureGuestSessionId();
    await cartRepo.addItem(guestSessionId, input);
  }
  revalidatePath("/", "layout");
}

export async function updateCartItemAction(itemId: string, quantity: number): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await cartRepo.updateQuantityAsUser(user.id, itemId, quantity);
  } else {
    const guestSessionId = await ensureGuestSessionId();
    await cartRepo.updateQuantity(guestSessionId, itemId, quantity);
  }
  revalidatePath("/", "layout");
}

export async function removeCartItemAction(itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await cartRepo.removeItemAsUser(user.id, itemId);
  } else {
    const guestSessionId = await ensureGuestSessionId();
    await cartRepo.removeItem(guestSessionId, itemId);
  }
  revalidatePath("/", "layout");
}

export async function clearCartAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await cartRepo.clearAsUser(user.id);
  } else {
    const guestSessionId = await ensureGuestSessionId();
    await cartRepo.clear(guestSessionId);
  }
  revalidatePath("/", "layout");
}
```

- [ ] **Step 4: Add the new user-cart methods to `cartRepo`**

Edit `src/lib/db/repos/cart.ts`. Inside the `CartRepo` interface, add:

```ts
  updateQuantityAsUser(userId: string, itemId: string, quantity: number): Promise<Cart>;
  removeItemAsUser(userId: string, itemId: string): Promise<Cart>;
  clearAsUser(userId: string): Promise<Cart>;
```

In the implementation object, add (mirroring the guest-cart methods but using `ensureUserCart`):

```ts
  async updateQuantityAsUser(userId, itemId, quantity) {
    const cart = ensureUserCart(userId);
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

  async removeItemAsUser(userId, itemId) {
    const cart = ensureUserCart(userId);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.updatedAt = nowIso();
    return cart;
  },

  async clearAsUser(userId) {
    const cart = ensureUserCart(userId);
    cart.items = [];
    cart.updatedAt = nowIso();
    return cart;
  },
```

- [ ] **Step 5: Update `/cart` and `/checkout` pages to read user cart when signed in**

Phase 4 made the Header auth-aware; these two pages were left out. Update them now in the same change so the cart you see on every surface is consistent.

Replace the cart-reading block at the top of `src/app/(storefront)/cart/page.tsx`. Find:

```ts
const guestSessionId = await getGuestSessionId();
const cart = guestSessionId
  ? await cartRepo.getOrCreateForGuestSession(guestSessionId)
  : { id: "cart_empty", userId: null, guestSessionId: null, items: [], updatedAt: "" };
```

Replace with:

```ts
const user = await getCurrentUser();
const cart = user
  ? await cartRepo.getOrCreateForUser(user.id)
  : await (async () => {
      const guestSessionId = await getGuestSessionId();
      return guestSessionId
        ? cartRepo.getOrCreateForGuestSession(guestSessionId)
        : { id: "cart_empty", userId: null, guestSessionId: null, items: [], updatedAt: "" };
    })();
```

And add this import near the existing `getGuestSessionId` import:

```ts
import { getCurrentUser } from "@/lib/auth/current-user";
```

Do the same for `src/app/(storefront)/checkout/page.tsx`. Find:

```ts
const guestSessionId = await getGuestSessionId();
const cart = guestSessionId ? await cartRepo.getOrCreateForGuestSession(guestSessionId) : null;
```

Replace with:

```ts
const user = await getCurrentUser();
let cart;
if (user) {
  cart = await cartRepo.getOrCreateForUser(user.id);
} else {
  const guestSessionId = await getGuestSessionId();
  cart = guestSessionId ? await cartRepo.getOrCreateForGuestSession(guestSessionId) : null;
}
```

And add the `getCurrentUser` import.

- [ ] **Step 6: Run all cart-action + cart-repo tests; confirm passing**

```powershell
npx vitest run src/server/actions/cart.test.ts src/lib/db/repos/cart.test.ts
```

- [ ] **Step 7: Commit**

```powershell
git add src/server/actions/cart.ts src/server/actions/cart.test.ts src/lib/db/repos/cart.ts "src/app/(storefront)/cart/page.tsx" "src/app/(storefront)/checkout/page.tsx"
git commit -m "feat(cart): server actions and /cart, /checkout pages prefer user cart when signed in"
```

---

## Task 6: placeOrderAction prefers user cart and sets userId

**Files:** modify `src/server/actions/orders.ts`, `src/server/actions/orders.test.ts`

- [ ] **Step 1: Add a `vi.mock` for getCurrentUser at the top of `orders.test.ts`**

```ts
const getCurrentUserMock = vi.hoisted(() =>
  vi.fn<() => Promise<{ id: string; emailVerified: boolean } | null>>(async () => null),
);
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: getCurrentUserMock }));
```

And inside the existing `beforeEach`, add:

```ts
getCurrentUserMock.mockReset();
getCurrentUserMock.mockResolvedValue(null);
```

- [ ] **Step 2: Add a failing test inside the describe**

```ts
it("uses the user cart and sets userId on the order when signed in", async () => {
  getCurrentUserMock.mockResolvedValue({ id: "usr_user1", emailVerified: true });
  await cartRepo.addItemAsUser("usr_user1", {
    productId: "p",
    productSlug: "p",
    productName: "Amrita",
    variantSku: "sku",
    variantLabel: "Maroon",
    imageUrl: "https://x/y.jpg",
    unitPricePaise: 100000,
    unitMrpPaise: 120000,
    quantity: 1,
  });
  await expect(
    placeOrderAction({
      shippingAddress: address,
      shippingOption: shipping,
      paymentMethod: "razorpay",
    }),
  ).rejects.toThrow(/NEXT_REDIRECT/);
  const userOrders = await ordersRepo.listByUser("usr_user1");
  expect(userOrders).toHaveLength(1);
  expect(userOrders[0]?.userId).toBe("usr_user1");
  const cartAfter = await cartRepo.getOrCreateForUser("usr_user1");
  expect(cartAfter.items).toEqual([]);
});
```

- [ ] **Step 3: Replace `placeOrderAction` in `orders.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
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
  const user = await getCurrentUser();
  let cart;
  if (user) {
    cart = await cartRepo.getOrCreateForUser(user.id);
  } else {
    const guestSessionId = await ensureGuestSessionId();
    cart = await cartRepo.getOrCreateForGuestSession(guestSessionId);
  }

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
    userId: user?.id ?? null,
    guestSessionId: user ? null : cart.guestSessionId,
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

  if (user) {
    await cartRepo.clearAsUser(user.id);
  } else if (cart.guestSessionId) {
    await cartRepo.clear(cart.guestSessionId);
  }
  revalidatePath("/", "layout");
  redirect(`/checkout/success/${order.id}`);
}
```

- [ ] **Step 4: Run + commit**

```powershell
npx vitest run src/server/actions/orders.test.ts
git add src/server/actions/orders.ts src/server/actions/orders.test.ts
git commit -m "feat(orders): placeOrder uses user cart + sets userId when signed in"
```

---

## Task 7: Address Server Actions (TDD-lite — one combined test file)

**Files:** `src/server/actions/addresses.ts`, `src/server/actions/addresses.test.ts`

- [ ] **Step 1: Test file**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetAddressesRepo, addressesRepo } from "@/lib/db/repos/addresses";
import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  updateAddressAction,
} from "./addresses";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const getCurrentUserMock = vi.hoisted(() =>
  vi.fn<() => Promise<{ id: string } | null>>(async () => null),
);
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: getCurrentUserMock }));

const sample = {
  fullName: "Aishwarya R.",
  phone: "9876543210",
  email: "a@example.com",
  line1: "1 Anna Salai",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600002",
  country: "IN" as const,
};

describe("address server actions", () => {
  beforeEach(() => {
    __resetAddressesRepo();
    getCurrentUserMock.mockReset();
    getCurrentUserMock.mockResolvedValue({ id: "usr_addr" });
  });

  it("createAddressAction creates an address for the current user", async () => {
    await createAddressAction(sample);
    const list = await addressesRepo.listByUser("usr_addr");
    expect(list).toHaveLength(1);
    expect(list[0]?.isDefault).toBe(true);
  });

  it("updateAddressAction modifies fields", async () => {
    const created = await addressesRepo.create({ userId: "usr_addr", ...sample });
    await updateAddressAction(created.id, { label: "Home", city: "Bengaluru" });
    const updated = await addressesRepo.getById(created.id);
    expect(updated?.label).toBe("Home");
    expect(updated?.city).toBe("Bengaluru");
  });

  it("setDefaultAddressAction promotes the chosen address", async () => {
    const a = await addressesRepo.create({ userId: "usr_addr", ...sample });
    const b = await addressesRepo.create({
      userId: "usr_addr",
      ...sample,
      line1: "2 Mount Rd",
    });
    await setDefaultAddressAction(b.id);
    const list = await addressesRepo.listByUser("usr_addr");
    expect(list.find((x) => x.id === a.id)?.isDefault).toBe(false);
    expect(list.find((x) => x.id === b.id)?.isDefault).toBe(true);
  });

  it("deleteAddressAction removes the address", async () => {
    const a = await addressesRepo.create({ userId: "usr_addr", ...sample });
    await deleteAddressAction(a.id);
    expect(await addressesRepo.listByUser("usr_addr")).toEqual([]);
  });

  it("throws when no user is signed in", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);
    await expect(createAddressAction(sample)).rejects.toThrow(/sign in/i);
  });

  it("guards updates so a user cannot modify someone else's address", async () => {
    const otherUserAddr = await addressesRepo.create({ userId: "usr_other", ...sample });
    await expect(updateAddressAction(otherUserAddr.id, { city: "X" })).rejects.toThrow(
      /forbidden|not found/i,
    );
  });
});
```

- [ ] **Step 2: Implementation `src/server/actions/addresses.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  addressesRepo,
  type CreateAddressInput,
  type UpdateAddressInput,
} from "@/lib/db/repos/addresses";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in to manage your addresses.");
  return user;
}

export type CreateAddressActionInput = Omit<CreateAddressInput, "userId">;

export async function createAddressAction(input: CreateAddressActionInput): Promise<void> {
  const user = await requireUser();
  await addressesRepo.create({ ...input, userId: user.id });
  revalidatePath("/account/addresses");
}

export async function updateAddressAction(id: string, input: UpdateAddressInput): Promise<void> {
  const user = await requireUser();
  const existing = await addressesRepo.getById(id);
  if (!existing || existing.userId !== user.id) {
    throw new Error("Address not found.");
  }
  await addressesRepo.update(id, input);
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(id: string): Promise<void> {
  const user = await requireUser();
  const existing = await addressesRepo.getById(id);
  if (!existing || existing.userId !== user.id) {
    throw new Error("Address not found.");
  }
  await addressesRepo.setDefault(user.id, id);
  revalidatePath("/account/addresses");
}

export async function deleteAddressAction(id: string): Promise<void> {
  const user = await requireUser();
  const existing = await addressesRepo.getById(id);
  if (!existing || existing.userId !== user.id) {
    throw new Error("Address not found.");
  }
  await addressesRepo.delete(id);
  revalidatePath("/account/addresses");
}
```

- [ ] **Step 3: Run + commit**

```powershell
npx vitest run src/server/actions/addresses.test.ts
git add src/server/actions/addresses.ts src/server/actions/addresses.test.ts
git commit -m "feat(actions): address CRUD server actions with ownership guard"
```

---

## Task 8: Wishlist Server Actions

**Files:** `src/server/actions/wishlist.ts`, `src/server/actions/wishlist.test.ts`

- [ ] **Step 1: Test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetWishlistRepo, wishlistRepo } from "@/lib/db/repos/wishlist";
import { addToWishlistAction, removeFromWishlistAction } from "./wishlist";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const getCurrentUserMock = vi.hoisted(() =>
  vi.fn<() => Promise<{ id: string } | null>>(async () => null),
);
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: getCurrentUserMock }));

const sample = {
  productId: "prd_a",
  productSlug: "p-a",
  productName: "Amrita",
  imageUrl: "https://x/y.jpg",
  priceInPaise: 100000,
  mrpInPaise: 120000,
};

describe("wishlist server actions", () => {
  beforeEach(() => {
    __resetWishlistRepo();
    getCurrentUserMock.mockReset();
    getCurrentUserMock.mockResolvedValue({ id: "usr_wl" });
  });

  it("adds and removes a wishlist item for the current user", async () => {
    await addToWishlistAction(sample);
    expect(await wishlistRepo.has("usr_wl", "prd_a")).toBe(true);
    await removeFromWishlistAction("prd_a");
    expect(await wishlistRepo.has("usr_wl", "prd_a")).toBe(false);
  });

  it("requires a signed-in user", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);
    await expect(addToWishlistAction(sample)).rejects.toThrow(/sign in/i);
  });
});
```

- [ ] **Step 2: Implementation `src/server/actions/wishlist.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { wishlistRepo, type AddWishlistInput } from "@/lib/db/repos/wishlist";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in to use your wishlist.");
  return user;
}

export type AddWishlistActionInput = Omit<AddWishlistInput, "userId">;

export async function addToWishlistAction(input: AddWishlistActionInput): Promise<void> {
  const user = await requireUser();
  await wishlistRepo.add({ ...input, userId: user.id });
  revalidatePath("/account/wishlist");
  revalidatePath("/", "layout");
}

export async function removeFromWishlistAction(productId: string): Promise<void> {
  const user = await requireUser();
  await wishlistRepo.remove(user.id, productId);
  revalidatePath("/account/wishlist");
  revalidatePath("/", "layout");
}
```

- [ ] **Step 3: Run + commit**

```powershell
npx vitest run src/server/actions/wishlist.test.ts
git add src/server/actions/wishlist.ts src/server/actions/wishlist.test.ts
git commit -m "feat(actions): wishlist add/remove server actions"
```

---

## Task 9: Profile actions

**Files:** `src/server/actions/profile.ts`, `src/server/actions/profile.test.ts`

- [ ] **Step 1: Test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPasswordStub } from "@/lib/auth/passwords";
import { __resetUsersRepo, usersRepo } from "@/lib/db/repos/users";
import { changePasswordAction, updateNameAction } from "./profile";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const getCurrentUserMock = vi.hoisted(() =>
  vi.fn<() => Promise<{ id: string } | null>>(async () => null),
);
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: getCurrentUserMock }));

describe("profile server actions", () => {
  beforeEach(async () => {
    __resetUsersRepo();
    getCurrentUserMock.mockReset();
  });

  it("updateNameAction sets a new full name on the current user", async () => {
    const user = await usersRepo.create({
      email: "n@example.com",
      fullName: "Old Name",
      passwordHash: await hashPasswordStub("x"),
    });
    getCurrentUserMock.mockResolvedValueOnce({ id: user.id });
    await updateNameAction({ fullName: "New Name" });
    const updated = await usersRepo.findById(user.id);
    expect(updated?.fullName).toBe("New Name");
  });

  it("changePasswordAction requires the correct current password", async () => {
    const user = await usersRepo.create({
      email: "c@example.com",
      fullName: "C",
      passwordHash: await hashPasswordStub("Right!23"),
    });
    getCurrentUserMock.mockResolvedValue({ id: user.id });
    await expect(
      changePasswordAction({ currentPassword: "Wrong!23", newPassword: "Hunter22!" }),
    ).rejects.toThrow(/current password/i);

    await changePasswordAction({ currentPassword: "Right!23", newPassword: "Hunter22!" });
    const updated = await usersRepo.findById(user.id);
    expect(updated?.passwordHash).toMatch(/Hunter22!/);
  });
});
```

- [ ] **Step 2: Implementation `src/server/actions/profile.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hashPasswordStub, verifyPasswordStub } from "@/lib/auth/passwords";
import { usersRepo } from "@/lib/db/repos/users";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in.");
  return user;
}

export interface UpdateNameInput {
  fullName: string;
}

export async function updateNameAction(input: UpdateNameInput): Promise<void> {
  const user = await requireUser();
  const fullName = input.fullName.trim();
  if (fullName.length < 2) throw new Error("Name must be at least 2 characters.");
  const stored = await usersRepo.findById(user.id);
  if (!stored) throw new Error("Account not found.");
  stored.fullName = fullName;
  stored.updatedAt = new Date().toISOString();
  revalidatePath("/", "layout");
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function changePasswordAction(input: ChangePasswordInput): Promise<void> {
  const user = await requireUser();
  const stored = await usersRepo.findById(user.id);
  if (!stored) throw new Error("Account not found.");
  const ok = await verifyPasswordStub(input.currentPassword, stored.passwordHash);
  if (!ok) throw new Error("Current password is incorrect.");
  if (input.newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
  const newHash = await hashPasswordStub(input.newPassword);
  await usersRepo.updatePasswordHash(user.id, newHash);
  revalidatePath("/", "layout");
}
```

> Note: `updateNameAction` mutates the user record in place via the singleton map. In a real DB phase this becomes a proper update statement.

- [ ] **Step 3: Run + commit**

```powershell
npx vitest run src/server/actions/profile.test.ts
git add src/server/actions/profile.ts src/server/actions/profile.test.ts
git commit -m "feat(actions): profile name + password server actions"
```

---

## Task 10: AccountShell layout + nav

**Files:** `src/components/account/AccountShell.tsx`, `src/app/(storefront)/(account)/layout.tsx`

- [ ] **Step 1: Create `AccountShell.tsx`**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { Heart, LayoutDashboard, MapPin, Package, User as UserIcon } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { Container } from "@/components/ui/Container";

const NAV: { href: string; label: string; icon: typeof UserIcon }[] = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile", icon: UserIcon },
];

export interface AccountShellProps {
  currentPath: string;
  userName: string;
  userEmail: string;
  children: ReactNode;
}

export function AccountShell({ currentPath, userName, userEmail, children }: AccountShellProps) {
  return (
    <Container size="xl" className="py-10">
      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">Account</span>
            <span className="font-display text-2xl text-ink-900">{userName}</span>
            <span className="text-sm text-ink-500">{userEmail}</span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/account"
                  ? currentPath === "/account"
                  : currentPath.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition",
                    active
                      ? "bg-ink-900 text-white"
                      : "text-ink-700 hover:bg-ink-900/5 hover:text-ink-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Create `src/app/(storefront)/(account)/layout.tsx`**

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AccountShell } from "@/components/account/AccountShell";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account");
  const headerList = await headers();
  const currentPath = headerList.get("x-pathname") ?? "/account";
  return (
    <AccountShell currentPath={currentPath} userName={user.fullName} userEmail={user.email}>
      {children}
    </AccountShell>
  );
}
```

> Note: `x-pathname` isn't a Next built-in header. To get the active path inside a layout, you have two practical options:
>
> 1. Read `headers().get("x-next-url")` or `referer` — both are unreliable.
> 2. Don't compute it server-side; let each page page that wraps content set it. Easier: extract a small `ActiveLink` client component below that uses `usePathname()`.
>
> Use option 2 to avoid the header gymnastics. Replace the layout above with:

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AccountShell } from "@/components/account/AccountShell";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account");
  return (
    <AccountShell userName={user.fullName} userEmail={user.email}>
      {children}
    </AccountShell>
  );
}
```

And update `AccountShell` to use a client-component nav that reads `usePathname`:

Add at the bottom of `AccountShell.tsx` (replacing the `<nav>` block inline):

```tsx
// Replace the entire AccountShell.tsx with:
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Heart, LayoutDashboard, MapPin, Package, User as UserIcon } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { Container } from "@/components/ui/Container";

const NAV: { href: string; label: string; icon: typeof UserIcon }[] = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile", icon: UserIcon },
];

export interface AccountShellProps {
  userName: string;
  userEmail: string;
  children: ReactNode;
}

export function AccountShell({ userName, userEmail, children }: AccountShellProps) {
  const pathname = usePathname();
  return (
    <Container size="xl" className="py-10">
      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">Account</span>
            <span className="font-display text-2xl text-ink-900">{userName}</span>
            <span className="text-sm text-ink-500">{userEmail}</span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/account"
                  ? pathname === "/account"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition",
                    active
                      ? "bg-ink-900 text-white"
                      : "text-ink-700 hover:bg-ink-900/5 hover:text-ink-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
```

(Final shell uses `"use client"` + `usePathname`.)

- [ ] **Step 3: Commit**

```powershell
git add src/components/account/AccountShell.tsx "src/app/(storefront)/(account)/layout.tsx"
git commit -m "feat(account): add AccountShell sidebar layout"
```

---

## Task 11: Move /account into the (account) group and refactor dashboard

**Files:** delete `src/app/(storefront)/account/page.tsx`, create `src/app/(storefront)/(account)/account/page.tsx`

- [ ] **Step 1: Move the old account page**

```powershell
git mv "src/app/(storefront)/account/page.tsx" "src/app/(storefront)/(account)/account/page.tsx"
```

> Note: route groups `(account)` do not appear in URLs, so both the old and new positions yield `/account`. The move is purely about which layout wraps the page.

- [ ] **Step 2: Replace the moved page**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Heart, MapPin, Package, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { addressesRepo } from "@/lib/db/repos/addresses";
import { ordersRepo } from "@/lib/db/repos/orders";
import { wishlistRepo } from "@/lib/db/repos/wishlist";
import { logoutAction } from "@/server/actions/auth";

export const metadata = { title: "Account · Saree Store" };

const TILES = [
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile", icon: User },
];

export default async function AccountDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account");

  const [orders, addresses, wishlist] = await Promise.all([
    ordersRepo.listByUser(user.id),
    addressesRepo.listByUser(user.id),
    wishlistRepo.listByUser(user.id),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-ink-900 md:text-4xl">
          Welcome back, {user.fullName.split(" ")[0]}.
        </h1>
        <p className="text-ink-700">
          A quick view of your orders, saved addresses, and saved sarees.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Orders", value: orders.length },
          { label: "Addresses", value: addresses.length },
          { label: "Wishlist", value: wishlist.length },
          {
            label: "Member since",
            value: new Date(user.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            }),
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-md border border-ink-500/10 bg-bg-elevated p-4">
            <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
            <div className="mt-1 font-display text-2xl text-ink-900">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className="group flex items-center justify-between gap-4 rounded-md border border-ink-500/10 bg-bg-elevated p-6 transition hover:border-ink-900"
            >
              <div className="flex items-center gap-4">
                <Icon className="h-6 w-6 text-accent-gold" />
                <span className="font-display text-xl text-ink-900">{tile.label}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-500 transition group-hover:text-ink-900" />
            </Link>
          );
        })}
      </section>

      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-sm border border-ink-500/30 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-900 hover:text-ink-900"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Build verify + commit**

```powershell
npx next build
git add "src/app/(storefront)/(account)/account/page.tsx" "src/app/(storefront)/account"
git commit -m "feat(account): move dashboard into (account) group + add KPI tiles"
```

---

## Task 12: OrderStatus components + Orders list page

**Files:**

- `src/components/account/OrderStatusBadge.tsx`
- `src/components/account/OrderStatusTimeline.tsx`
- `src/components/account/OrderCard.tsx`
- `src/app/(storefront)/(account)/account/orders/page.tsx`

- [ ] **Step 1: Create `OrderStatusBadge.tsx`**

```tsx
import { Badge } from "@/components/ui/Badge";
import type { OrderStatus } from "@/types/domain";

const TONE: Record<OrderStatus, "neutral" | "accent" | "gold" | "success" | "warning" | "danger"> =
  {
    pending_payment: "warning",
    confirmed: "neutral",
    paid: "gold",
    shipped: "accent",
    delivered: "success",
    cancelled: "danger",
    payment_failed: "danger",
  };

const LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{LABEL[status]}</Badge>;
}
```

- [ ] **Step 2: Create `OrderStatusTimeline.tsx`**

```tsx
import { Check, Circle } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import type { OrderStatus } from "@/types/domain";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "confirmed", label: "Confirmed" },
  { status: "paid", label: "Paid" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

const RANK: Record<OrderStatus, number> = {
  pending_payment: 0,
  confirmed: 1,
  paid: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
  payment_failed: -1,
};

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const current = RANK[status] ?? 0;
  return (
    <ol className="flex flex-col gap-4">
      {STEPS.map((step) => {
        const idx = RANK[step.status];
        const done = current >= idx;
        return (
          <li key={step.status} className="flex items-start gap-3">
            <span
              className={clsx(
                "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border",
                done
                  ? "border-success bg-success text-white"
                  : "border-ink-500/30 bg-bg-elevated text-ink-500",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2" />}
            </span>
            <span className={clsx("text-sm", done ? "text-ink-900" : "text-ink-500")}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 3: Create `OrderCard.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import { formatRupees } from "@/lib/money";
import type { Order } from "@/types/domain";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrderCard({ order }: { order: Order }) {
  const placed = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const preview = order.items.slice(0, 3);
  const remaining = order.items.length - preview.length;
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="flex flex-col gap-4 rounded-md border border-ink-500/10 bg-bg-elevated p-5 transition hover:border-ink-900"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase tracking-wide text-ink-500">Order</span>
          <span className="font-medium text-ink-900">{order.id}</span>
          <span className="text-xs text-ink-500">Placed {placed}</span>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>
      <div className="flex items-center gap-3">
        {preview.map((it) => (
          <div
            key={it.variantSku}
            className="relative h-14 w-12 shrink-0 overflow-hidden rounded-sm bg-ink-500/5"
          >
            {it.imageUrl && (
              <Image
                src={it.imageUrl}
                alt={it.productName}
                fill
                sizes="48px"
                className="object-cover"
              />
            )}
          </div>
        ))}
        {remaining > 0 && <span className="text-xs text-ink-500">+{remaining} more</span>}
      </div>
      <footer className="flex items-center justify-between">
        <span className="text-sm text-ink-700">
          {order.items.length} {order.items.length === 1 ? "item" : "items"}
        </span>
        <span className="font-semibold tabular-nums text-ink-900">
          {formatRupees(order.totalPaise)}
        </span>
      </footer>
    </Link>
  );
}
```

- [ ] **Step 4: Create `account/orders/page.tsx`**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ordersRepo } from "@/lib/db/repos/orders";
import { OrderCard } from "@/components/account/OrderCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Orders · Saree Store" };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account/orders");
  const orders = await ordersRepo.listByUser(user.id);

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Find a saree you love and we'll keep your orders here."
        action={
          <Link
            href="/shop"
            className="mt-2 inline-flex items-center justify-center rounded-sm bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
          >
            Shop sarees
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink-900">Your orders</h1>
        <p className="text-sm text-ink-700">
          {orders.length} {orders.length === 1 ? "order" : "orders"} placed.
        </p>
      </header>
      <ul className="flex flex-col gap-4">
        {orders.map((o) => (
          <li key={o.id}>
            <OrderCard order={o} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: Build verify + commit**

```powershell
npx next build
git add src/components/account/OrderStatusBadge.tsx src/components/account/OrderStatusTimeline.tsx src/components/account/OrderCard.tsx "src/app/(storefront)/(account)/account/orders/page.tsx"
git commit -m "feat(account): add orders list page with status badges + cards"
```

---

## Task 13: Order detail page

**File:** `src/app/(storefront)/(account)/account/orders/[orderId]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ordersRepo } from "@/lib/db/repos/orders";
import { formatRupees } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/account/OrderStatusTimeline";
import { CartSummary } from "@/components/storefront/CartSummary";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=/account/orders/${orderId}`);
  const order = await ordersRepo.getById(orderId);
  if (!order || order.userId !== user.id) notFound();

  const placed = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        items={[
          { label: "Account", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: order.id },
        ]}
      />
      <header className="flex flex-col items-start gap-2">
        <span className="text-xs uppercase tracking-wide text-ink-500">Order placed {placed}</span>
        <h1 className="font-display text-3xl text-ink-900">{order.id}</h1>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="grid gap-10 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-8">
          <section className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
            <h2 className="mb-4 font-display text-xl text-ink-900">Status</h2>
            <OrderStatusTimeline status={order.status} />
          </section>

          <section>
            <h2 className="mb-4 font-display text-xl text-ink-900">Items</h2>
            <ul className="flex flex-col divide-y divide-ink-500/10">
              {order.items.map((it) => (
                <li key={it.variantSku} className="flex items-start gap-4 py-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-ink-500/5">
                    {it.imageUrl && (
                      <Image
                        src={it.imageUrl}
                        alt={it.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 text-sm">
                    <Link
                      href={`/product/${it.productSlug}`}
                      className="font-medium text-ink-900 transition hover:text-accent-primary"
                    >
                      {it.productName}
                    </Link>
                    <span className="text-xs text-ink-500">
                      {it.variantLabel} · Qty {it.quantity}
                    </span>
                    <span className="mt-1 font-semibold tabular-nums text-ink-900">
                      {formatRupees(it.lineTotalPaise)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <CartSummary
            subtotalPaise={order.subtotalPaise}
            shippingPaise={order.shippingPaise}
            taxPaise={order.taxPaise}
            totalPaise={order.totalPaise}
          />

          <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
            <h3 className="mb-3 font-display text-lg text-ink-900">Shipping to</h3>
            <p className="text-sm text-ink-700">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.pincode}
              <br />
              {order.shippingAddress.phone}
            </p>
            <p className="mt-3 text-xs text-ink-500">
              {order.shippingOption.name} · {order.shippingOption.etaDays} business days
            </p>
          </div>

          <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
            <h3 className="mb-2 font-display text-lg text-ink-900">Payment</h3>
            <p className="text-sm text-ink-700 capitalize">
              {order.paymentMethod === "cod" ? "Cash on delivery" : "Online (Razorpay)"}
              <br />
              <span className="text-xs text-ink-500">Status: {order.paymentStatus}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build verify + commit**

```powershell
npx next build
git add "src/app/(storefront)/(account)/account/orders/[orderId]/page.tsx"
git commit -m "feat(account): add order detail page with timeline + shipping + payment"
```

---

## Task 14: SavedAddressForm + AddressCard + addresses page

**Files:**

- `src/components/account/SavedAddressForm.tsx`
- `src/components/account/AddressCard.tsx`
- `src/app/(storefront)/(account)/account/addresses/page.tsx`

- [ ] **Step 1: Create `SavedAddressForm.tsx`**

```tsx
"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { INDIA_STATES } from "@/lib/cart/india-states";
import { createAddressAction, updateAddressAction } from "@/server/actions/addresses";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile"),
  email: z.email("Enter a valid email"),
  line1: z.string().min(5, "Required"),
  line2: z.string().optional(),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
  label: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export interface SavedAddressFormProps {
  editId?: string;
  defaultValues?: Partial<Values>;
  onComplete?: () => void;
}

export function SavedAddressForm({ editId, defaultValues, onComplete }: SavedAddressFormProps) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        if (editId) {
          await updateAddressAction(editId, values);
          toast.success("Address updated");
        } else {
          await createAddressAction({ ...values, country: "IN" });
          toast.success("Address added");
        }
        reset();
        onComplete?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save the address.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
      <FormField
        label="Label (optional)"
        htmlFor="label"
        className="md:col-span-2"
        error={errors.label?.message}
      >
        <Input id="label" placeholder="Home, Office, etc." {...register("label")} />
      </FormField>
      <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <Input id="fullName" {...register("fullName")} invalid={!!errors.fullName} />
      </FormField>
      <FormField label="Mobile" htmlFor="phone" required error={errors.phone?.message}>
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
        className="md:col-span-2"
        error={errors.state?.message}
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
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : editId ? "Save changes" : "Add address"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create `AddressCard.tsx`**

```tsx
"use client";

import { useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAddressAction, setDefaultAddressAction } from "@/server/actions/addresses";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import type { SavedAddress } from "@/types/domain";

export function AddressCard({
  address,
  onEdit,
}: {
  address: SavedAddress;
  onEdit: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  function setDefault() {
    startTransition(async () => {
      try {
        await setDefaultAddressAction(address.id);
        toast.success("Default address updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        await deleteAddressAction(address.id);
        toast.success("Address removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <article className="flex flex-col gap-3 rounded-md border border-ink-500/10 bg-bg-elevated p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg text-ink-900">{address.label ?? "Address"}</h3>
          {address.isDefault && <Badge tone="gold">Default</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {!address.isDefault && (
            <IconButton aria-label="Set as default" onClick={setDefault} disabled={pending}>
              <Star className="h-4 w-4" />
            </IconButton>
          )}
          <IconButton aria-label="Delete" onClick={remove} disabled={pending}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </header>
      <div className="text-sm text-ink-700">
        <p className="font-medium text-ink-900">{address.fullName}</p>
        <p>
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
        </p>
        <p>
          {address.city}, {address.state} {address.pincode}
        </p>
        <p className="mt-1 text-xs text-ink-500">{address.phone}</p>
      </div>
      <button
        type="button"
        onClick={() => onEdit(address.id)}
        className="self-start text-xs uppercase tracking-wide text-ink-500 transition hover:text-ink-900"
      >
        Edit
      </button>
    </article>
  );
}
```

- [ ] **Step 3: Create `account/addresses/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { addressesRepo } from "@/lib/db/repos/addresses";
import { AddressesPageClient } from "./client";

export const metadata = { title: "Addresses · Saree Store" };

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account/addresses");
  const addresses = await addressesRepo.listByUser(user.id);
  return <AddressesPageClient addresses={addresses} />;
}
```

Create `src/app/(storefront)/(account)/account/addresses/client.tsx`:

```tsx
"use client";

import { useState } from "react";
import { AddressCard } from "@/components/account/AddressCard";
import { SavedAddressForm } from "@/components/account/SavedAddressForm";
import type { SavedAddress } from "@/types/domain";

export function AddressesPageClient({ addresses }: { addresses: SavedAddress[] }) {
  const [editId, setEditId] = useState<string | null>(null);
  const editing = addresses.find((a) => a.id === editId) ?? null;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink-900">Addresses</h1>
        <p className="text-sm text-ink-700">Manage where your sarees should ship.</p>
      </header>

      <section>
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <AddressCard key={a.id} address={a} onEdit={setEditId} />
          ))}
        </div>
      </section>

      <section className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="mb-4 font-display text-2xl text-ink-900">
          {editing ? "Edit address" : "Add a new address"}
        </h2>
        <SavedAddressForm
          editId={editing?.id}
          defaultValues={editing ?? undefined}
          onComplete={() => setEditId(null)}
        />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Build + commit**

```powershell
npx next build
git add src/components/account/SavedAddressForm.tsx src/components/account/AddressCard.tsx "src/app/(storefront)/(account)/account/addresses"
git commit -m "feat(account): add addresses page with CRUD + default management"
```

---

## Task 15: Profile page (name + password)

**Files:**

- `src/components/account/ProfileForm.tsx`
- `src/components/account/ChangePasswordForm.tsx`
- `src/app/(storefront)/(account)/account/profile/page.tsx`

- [ ] **Step 1: Create `ProfileForm.tsx`**

```tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { updateNameAction } from "@/server/actions/profile";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
});
type Values = z.infer<typeof schema>;

export function ProfileForm({
  defaultFullName,
  email,
}: {
  defaultFullName: string;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: defaultFullName },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        await updateNameAction(values);
        toast.success("Name updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <Input id="fullName" {...register("fullName")} invalid={!!errors.fullName} />
      </FormField>
      <FormField label="Email" htmlFor="email" hint="Email cannot be changed in this phase">
        <Input id="email" value={email} disabled />
      </FormField>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create `ChangePasswordForm.tsx`**

```tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { changePasswordAction } from "@/server/actions/profile";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";

const schema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "Use at least 8 characters"),
});
type Values = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        await changePasswordAction(values);
        toast.success("Password updated");
        reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField
        label="Current password"
        htmlFor="currentPassword"
        required
        error={errors.currentPassword?.message}
      >
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          {...register("currentPassword")}
          invalid={!!errors.currentPassword}
        />
      </FormField>
      <FormField
        label="New password"
        htmlFor="newPassword"
        required
        hint="At least 8 characters"
        error={errors.newPassword?.message}
      >
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          {...register("newPassword")}
          invalid={!!errors.newPassword}
        />
      </FormField>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create `account/profile/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata = { title: "Profile · Saree Store" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account/profile");
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink-900">Profile</h1>
        <p className="text-sm text-ink-700">Update your name and password.</p>
      </header>
      <section className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="mb-4 font-display text-2xl text-ink-900">Personal</h2>
        <ProfileForm defaultFullName={user.fullName} email={user.email} />
      </section>
      <section className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="mb-4 font-display text-2xl text-ink-900">Password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Build + commit**

```powershell
npx next build
git add src/components/account/ProfileForm.tsx src/components/account/ChangePasswordForm.tsx "src/app/(storefront)/(account)/account/profile/page.tsx"
git commit -m "feat(account): add profile page (name + password change)"
```

---

## Task 16: WishlistButton + wire into ProductCard + wishlist page

**Files:**

- `src/components/storefront/WishlistButton.tsx`
- modify `src/components/storefront/ProductCard.tsx`
- `src/components/account/WishlistGrid.tsx`
- `src/app/(storefront)/(account)/account/wishlist/page.tsx`

- [ ] **Step 1: Create `WishlistButton.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import { addToWishlistAction, removeFromWishlistAction } from "@/server/actions/wishlist";

export interface WishlistButtonProps {
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string;
  priceInPaise: number;
  mrpInPaise: number;
  initiallyOn?: boolean;
  className?: string;
}

export function WishlistButton({
  productId,
  productSlug,
  productName,
  imageUrl,
  priceInPaise,
  mrpInPaise,
  initiallyOn = false,
  className,
}: WishlistButtonProps) {
  const [on, setOn] = useState(initiallyOn);
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        if (on) {
          await removeFromWishlistAction(productId);
          setOn(false);
          toast.success("Removed from wishlist");
        } else {
          await addToWishlistAction({
            productId,
            productSlug,
            productName,
            imageUrl,
            priceInPaise,
            mrpInPaise,
          });
          setOn(true);
          toast.success("Added to wishlist");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sign in to use the wishlist.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={on}
      className={clsx(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border bg-bg-elevated/90 backdrop-blur transition",
        on
          ? "border-accent-primary text-accent-primary"
          : "border-ink-500/20 text-ink-700 hover:border-ink-900 hover:text-ink-900",
        className,
      )}
    >
      <Heart className={clsx("h-4 w-4", on && "fill-current")} />
    </button>
  );
}
```

- [ ] **Step 2: Modify `src/components/storefront/ProductCard.tsx`**

Replace the entire file with:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "@/lib/utils/clsx";
import { PriceTag } from "@/components/ui/PriceTag";
import type { Product } from "@/types/domain";
import { WishlistButton } from "./WishlistButton";

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
      className={clsx("group relative flex flex-col gap-3", className)}
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
        <div className="absolute right-3 top-3">
          <WishlistButton
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            imageUrl={primaryImage.url}
            priceInPaise={product.priceInPaise}
            mrpInPaise={product.mrpInPaise}
          />
        </div>
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

- [ ] **Step 3: Create `WishlistGrid.tsx`**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeFromWishlistAction } from "@/server/actions/wishlist";
import { IconButton } from "@/components/ui/IconButton";
import { PriceTag } from "@/components/ui/PriceTag";
import type { WishlistItem } from "@/types/domain";

export function WishlistGrid({ items }: { items: WishlistItem[] }) {
  const [pending, startTransition] = useTransition();

  function removeItem(productId: string) {
    startTransition(async () => {
      try {
        await removeFromWishlistAction(productId);
        toast.success("Removed from wishlist");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="relative">
          <Link href={`/product/${item.productSlug}`} className="group flex flex-col gap-3">
            <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-ink-500/5">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <h3 className="font-display text-lg text-ink-900">{item.productName}</h3>
            <PriceTag priceInPaise={item.priceInPaise} mrpInPaise={item.mrpInPaise} size="sm" />
          </Link>
          <div className="absolute right-3 top-3">
            <IconButton
              aria-label="Remove from wishlist"
              onClick={() => removeItem(item.productId)}
              disabled={pending}
              variant="solid"
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `account/wishlist/page.tsx`**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { wishlistRepo } from "@/lib/db/repos/wishlist";
import { WishlistGrid } from "@/components/account/WishlistGrid";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Wishlist · Saree Store" };

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account/wishlist");
  const items = await wishlistRepo.listByUser(user.id);

  if (items.length === 0) {
    return (
      <EmptyState
        title="No saved sarees yet"
        description="Tap the heart on any product to save it for later."
        action={
          <Link
            href="/shop"
            className="mt-2 inline-flex items-center justify-center rounded-sm bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
          >
            Shop sarees
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink-900">Wishlist</h1>
        <p className="text-sm text-ink-700">{items.length} saved sarees.</p>
      </header>
      <WishlistGrid items={items} />
    </div>
  );
}
```

- [ ] **Step 5: Build + commit**

```powershell
npx next build
git add src/components/storefront/WishlistButton.tsx src/components/storefront/ProductCard.tsx src/components/account/WishlistGrid.tsx "src/app/(storefront)/(account)/account/wishlist"
git commit -m "feat(account): add wishlist (button on ProductCard + /account/wishlist)"
```

---

## Task 17: E2E account flow

**File:** `tests/e2e/account.spec.ts`

- [ ] **Step 1: Create the file**

```ts
import { expect, test } from "@playwright/test";

async function signUpAndVerify(page: import("@playwright/test").Page, email: string) {
  await page.goto("/auth/signup");
  await page.getByLabel(/Full name/i).fill("Account Test");
  await page.getByLabel(/^Email/i).fill(email);
  await page.getByLabel(/^Password/i).fill("Hunter22!");
  await page.getByRole("button", { name: /Create account/i }).click();
  await expect(page).toHaveURL(/\/auth\/verify\?email=/);
  const digits = page.getByLabel(/^Digit \d$/);
  for (let i = 0; i < 6; i++) {
    await digits.nth(i).fill("123456"[i]!);
  }
  await page.getByRole("button", { name: /Verify and continue/i }).click();
  await expect(page).toHaveURL(/\/account(\?|$)/);
}

test.describe("Account flow", () => {
  test("user can add an address from /account/addresses", async ({ page }) => {
    await signUpAndVerify(page, `addr+${Date.now()}@example.com`);
    await page.goto("/account/addresses");
    await page.getByLabel(/Full name/i).fill("Test User");
    await page.getByLabel(/Mobile/i).fill("9876543210");
    await page.getByLabel(/^Email/i).fill("addr@example.com");
    await page.getByLabel(/Address line 1/i).fill("1 Anna Salai");
    await page.getByLabel(/^City/i).fill("Chennai");
    await page.getByLabel(/^Pincode/i).fill("600002");
    await page.getByLabel(/^State/i).selectOption("Tamil Nadu");
    await page.getByRole("button", { name: /Add address/i }).click();
    await expect(page.getByText(/Address added/)).toBeVisible();
  });

  test("placing an order while signed in routes it to /account/orders", async ({ page }) => {
    await signUpAndVerify(page, `order+${Date.now()}@example.com`);

    await page.goto("/product/amrita-kanjivaram");
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await expect(page.getByText(/Added \d+ × Amrita Kanjivaram to cart/)).toBeVisible();

    await page.goto("/checkout");
    await page.getByLabel(/Full name/i).fill("Order Tester");
    await page.getByLabel(/Mobile number/i).fill("9876543210");
    await page.getByLabel(/^Email/i).fill("order@example.com");
    await page.getByLabel(/Address line 1/i).fill("1 Anna Salai");
    await page.getByLabel(/^City/i).fill("Chennai");
    await page.getByLabel(/^Pincode/i).fill("600002");
    await page.getByLabel(/^State/i).selectOption("Tamil Nadu");
    await page.getByRole("button", { name: /Continue to shipping/i }).click();
    await page.getByRole("button", { name: /Continue to payment/i }).click();
    await page.getByRole("button", { name: /Cash on delivery/i }).click();
    await page.getByRole("button", { name: /Place order/i }).click();

    await expect(page).toHaveURL(/\/checkout\/success\/ord_/);

    await page.goto("/account/orders");
    await expect(page.getByRole("heading", { name: /Your orders/i })).toBeVisible();
    const orderLinks = page.locator("a[href^='/account/orders/ord_']");
    expect(await orderLinks.count()).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run + commit**

```powershell
npm run e2e
git add tests/e2e/account.spec.ts
git commit -m "test(e2e): account flow (add address + order ends up under /account/orders)"
```

---

## Task 18: Final verification + tag

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
git tag -a phase-5-complete -m "Phase 5 (account UI) complete"
```

---

## What's NOT in this phase

- Reviews submission UI — Phase 8 (still gated on verified purchases when wired).
- Account orders → cancel / request return — backend phase.
- Real password change with bcrypt — backend phase.
- Order tracking via Shiprocket — Phase 7.
- 2FA / passkeys — out of scope.

## Spec coverage (§13.4 account section)

- Dashboard with KPIs ✓
- Orders list ✓
- Order detail with status timeline ✓
- Addresses CRUD with default management ✓
- Profile (name + password change) ✓
- Wishlist ✓
- Cart follows user across sessions ✓ (cart actions + placeOrder now use user cart when signed in)
