# Phase 7 — Admin: Orders + Customers + Coupons + Banners

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open the remaining four high-traffic admin sections — Orders (list + detail with status transitions, refund stub, internal notes), Customers (list + detail with block/unblock), Coupons (full CRUD), Banners (CRUD with placement + sort order). Phase 8 covers content, blog, static pages, and settings.

**Architecture:** Reuses Phases 0–6. Adds `couponsRepo` (mock, TDD) and turns `bannersRepo` mutable like `productsRepo` did in Phase 6 (globalThis-seeded from `BANNERS_FIXTURE`). `ordersRepo` gains status-transition and internal-note methods. `usersRepo` gains `listCustomers`, `blockUser`, `unblockUser`, and the `User` type gains a `blocked: boolean` field. All write surfaces go through admin-only Server Actions guarded by `getCurrentUser()` + role check.

**Tech Stack:** No new dependencies.

**Reference spec:** `docs/superpowers/specs/2026-05-16-saree-ecom-design.md` §12.

---

## Scope decisions

- **Coupon application at checkout:** deferred. Phase 7 builds admin CRUD only. Checkout will gain a coupon input in a backend-integration phase.
- **Order status transitions:** simple state machine (confirmed → shipped → delivered, plus cancel-any). Refund = cancel + display "Refund initiated".
- **Internal notes** on orders: append-only list rendered to admin. No edits/deletes.
- **Customer block** sets `User.blocked=true` and `clearSessionCookie`-style invalidation is deferred (blocking takes effect on next session creation).

---

## File Map

```
✎ src/types/domain.ts                    # User.blocked, AdminOrderNote, Coupon types, mutable BannerInput
✎ src/lib/db/repos/users.ts              # listCustomers, blockUser, unblockUser
✎ src/lib/db/repos/users.test.ts
✎ src/lib/db/repos/orders.ts             # updateStatus, addInternalNote, listAll already exists
✎ src/lib/db/repos/orders.test.ts
✎ src/lib/db/repos/banners.ts            # mutable store seeded from fixture + create/update/delete
✎ src/lib/db/repos/banners.test.ts
✚ src/lib/db/repos/coupons.ts            # full mock repo
✚ src/lib/db/repos/coupons.test.ts
✚ src/server/actions/admin-orders.ts
✚ src/server/actions/admin-orders.test.ts
✚ src/server/actions/admin-customers.ts
✚ src/server/actions/admin-coupons.ts
✚ src/server/actions/admin-coupons.test.ts
✚ src/server/actions/admin-banners.ts
✚ src/components/admin/AdminFilterBar.tsx       # generic search + status filter
✚ src/components/admin/OrderStatusActions.tsx   # status-change buttons
✚ src/components/admin/InternalNotes.tsx        # list + add form
✚ src/components/admin/CouponForm.tsx
✚ src/components/admin/BannerForm.tsx
✚ src/app/(admin)/admin/orders/page.tsx
✚ src/app/(admin)/admin/orders/[orderId]/page.tsx
✚ src/app/(admin)/admin/customers/page.tsx
✚ src/app/(admin)/admin/customers/[userId]/page.tsx
✚ src/app/(admin)/admin/coupons/page.tsx
✚ src/app/(admin)/admin/coupons/new/page.tsx
✚ src/app/(admin)/admin/coupons/[code]/page.tsx
✚ src/app/(admin)/admin/banners/page.tsx
✚ src/app/(admin)/admin/banners/new/page.tsx
✚ src/app/(admin)/admin/banners/[bannerId]/page.tsx
✚ tests/e2e/admin-rest.spec.ts
```

---

## Task 1: Domain types

Append to `src/types/domain.ts`:

```ts
export interface AdminOrderNote {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type CouponType = "percent" | "flat";
export type CouponStatus = "active" | "paused";

export interface Coupon {
  code: string;
  description?: string;
  type: CouponType;
  value: number; // percent: 0..100, flat: paise
  minOrderPaise?: number;
  maxDiscountPaise?: number; // cap for percent coupons
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BannerInput {
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
```

Add `blocked: boolean` to the existing `User` interface. Add `internalNotes: AdminOrderNote[]` to the existing `Order` interface (default `[]`).

Update `usersRepo.create` to default `blocked: false`. Update `ordersRepo.create` to default `internalNotes: []`.

Commit: `feat(types): add User.blocked, AdminOrderNote, Coupon, BannerInput`

---

## Task 2: usersRepo — listCustomers, blockUser, unblockUser

Add to `UsersRepo` interface:

```ts
listCustomers(options?: { search?: string; limit?: number }): Promise<User[]>;
blockUser(id: string): Promise<User | null>;
unblockUser(id: string): Promise<User | null>;
```

Implementation:

- `listCustomers`: returns users where role === "customer" (NOT admin/staff). Optional search filters by email or fullName substring (case-insensitive). Sorted by `createdAt` desc.
- `blockUser` / `unblockUser`: flip the `blocked` flag, update `updatedAt`.

Append 3 tests. Commit: `feat(repos): usersRepo listCustomers + block/unblock`

---

## Task 3: ordersRepo — updateStatus, addInternalNote

Add to `OrdersRepo` interface:

```ts
updateStatus(orderId: string, status: OrderStatus): Promise<Order | null>;
addInternalNote(orderId: string, note: { authorId: string; authorName: string; body: string }): Promise<Order | null>;
```

Implementation:

- `updateStatus`: set status + updatedAt. Allow any → any in mock (real state-machine validation comes later).
- `addInternalNote`: append `{ id: 'note_<nanoid(10)>', ...note, createdAt: nowIso() }` to `internalNotes`.

Append 2 tests. Commit: `feat(repos): ordersRepo status + internal notes`

---

## Task 4: bannersRepo — make mutable, add CRUD

Restructure `src/lib/db/repos/banners.ts` like `productsRepo` was done in Phase 6:

```ts
declare global {
  // eslint-disable-next-line no-var
  var __mockBanners: Map<string, Banner> | undefined;
}

function getStore(): Map<string, Banner> {
  if (globalThis.__mockBanners) return globalThis.__mockBanners;
  const store = new Map<string, Banner>();
  for (const b of BANNERS_FIXTURE) store.set(b.id, b);
  globalThis.__mockBanners = store;
  return store;
}
```

Add to `BannersRepo`:

```ts
listAll(): Promise<Banner[]>;
getById(id: string): Promise<Banner | null>;
create(input: BannerInput): Promise<Banner>;
update(id: string, input: Partial<BannerInput>): Promise<Banner | null>;
delete(id: string): Promise<void>;
```

`listByPlacement` keeps the same signature (filters `getStore()` by placement + active, sorted by sortOrder).

Add `__resetBannersRepo` helper.

Append 4 tests covering create/update/delete + listAll. Commit: `feat(repos): bannersRepo mutable + CRUD`

---

## Task 5: couponsRepo (mock, TDD)

Create `src/lib/db/repos/coupons.ts`:

```ts
// globalThis-backed Map<string, Coupon> keyed by uppercased code
// nowIso() helper
// Default code uppercase + trim on every method

export interface CouponsRepo {
  listAll(): Promise<Coupon[]>;
  getByCode(code: string): Promise<Coupon | null>;
  create(input: {
    code: string;
    description?: string;
    type: CouponType;
    value: number;
    minOrderPaise?: number;
    maxDiscountPaise?: number;
    maxUses?: number;
    validFrom: string;
    validTo: string;
    status: CouponStatus;
  }): Promise<Coupon>;
  update(
    code: string,
    input: Partial<{
      description: string;
      type: CouponType;
      value: number;
      minOrderPaise: number;
      maxDiscountPaise: number;
      maxUses: number;
      validFrom: string;
      validTo: string;
      status: CouponStatus;
    }>,
  ): Promise<Coupon | null>;
  delete(code: string): Promise<void>;
}
```

`create` throws if a coupon with the same code already exists. Sets `usedCount: 0`, `createdAt = updatedAt = nowIso()`.

Tests (5+):

- create + getByCode by code
- create with lowercase input is uppercased
- duplicate code throws
- update changes fields
- delete removes
- listAll sorts by createdAt desc

Commit: `feat(repos): mock couponsRepo with case-insensitive codes`

---

## Task 6: Admin orders Server Actions

`src/server/actions/admin-orders.ts`:

```ts
"use server";
// imports: getCurrentUser, ordersRepo, revalidatePath

async function requireAdmin() { ... } // copy from admin-products.ts

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<void> {
  await requireAdmin();
  await ordersRepo.updateStatus(orderId, status);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function refundOrderAction(orderId: string): Promise<void> {
  // Stub: set status to "cancelled" (real refund flow lands later)
  await requireAdmin();
  await ordersRepo.updateStatus(orderId, "cancelled");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function addOrderNoteAction(orderId: string, body: string): Promise<void> {
  const user = await requireAdmin();
  await ordersRepo.addInternalNote(orderId, { authorId: user.id, authorName: user.fullName, body });
  revalidatePath(`/admin/orders/${orderId}`);
}
```

3 tests (mock getCurrentUser admin/customer/no user; mock next/cache).

Commit: `feat(actions): admin order status, refund, internal notes`

---

## Task 7: Admin customers actions

`src/server/actions/admin-customers.ts`:

```ts
"use server";
// requireAdmin

export async function blockCustomerAction(userId: string): Promise<void> {
  await requireAdmin();
  await usersRepo.blockUser(userId);
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
}

export async function unblockCustomerAction(userId: string): Promise<void> {
  await requireAdmin();
  await usersRepo.unblockUser(userId);
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
}
```

No dedicated test file — exercised via the customer detail page e2e.

Commit: `feat(actions): admin block/unblock customer`

---

## Task 8: Admin coupons + banners Server Actions

`src/server/actions/admin-coupons.ts`:

```ts
"use server";
// createCouponAction, updateCouponAction, deleteCouponAction
// All require admin; on create, redirect to /admin/coupons/{code} after success
```

`src/server/actions/admin-banners.ts`:

```ts
"use server";
// createBannerAction, updateBannerAction, deleteBannerAction
// On create, redirect to /admin/banners/{bannerId}
```

3 unit tests for `admin-coupons.test.ts` (create + update + delete happy path). Banners action tests can be combined into one test verifying lifecycle.

Commit: `feat(actions): admin coupons + banners CRUD`

---

## Task 9: AdminFilterBar primitive

`src/components/admin/AdminFilterBar.tsx` — client component:

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export interface AdminFilterOption {
  value: string;
  label: string;
}

export interface AdminFilterBarProps {
  searchKey?: string;
  statusKey?: string;
  statusOptions?: AdminFilterOption[];
  placeholder?: string;
}

export function AdminFilterBar({
  searchKey = "q",
  statusKey = "status",
  statusOptions,
  placeholder = "Search…",
}: AdminFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function apply(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          type="search"
          defaultValue={params.get(searchKey) ?? ""}
          placeholder={placeholder}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set(searchKey, e.target.value);
            else next.delete(searchKey);
            apply(next);
          }}
          className="h-9 w-64 rounded-sm border border-ink-500/30 bg-bg-elevated pl-9 pr-3 text-sm text-ink-900 focus:border-accent-primary focus:outline-none"
        />
      </div>
      {statusOptions && (
        <select
          defaultValue={params.get(statusKey) ?? ""}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set(statusKey, e.target.value);
            else next.delete(statusKey);
            apply(next);
          }}
          className="h-9 rounded-sm border border-ink-500/30 bg-bg-elevated px-3 text-sm"
        >
          <option value="">All statuses</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
```

Commit: `feat(admin): add AdminFilterBar primitive`

---

## Task 10: Admin orders pages

`src/app/(admin)/admin/orders/page.tsx`:

```tsx
import Link from "next/link";
import { ordersRepo } from "@/lib/db/repos/orders";
import { formatRupees } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import type { Order } from "@/types/domain";

export const metadata = { title: "Orders · Admin" };

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams;
  let orders = await ordersRepo.listAll();
  if (status) orders = orders.filter((o) => o.status === status);
  if (q) {
    const needle = q.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(needle) ||
        o.shippingAddress.fullName.toLowerCase().includes(needle) ||
        o.shippingAddress.email.toLowerCase().includes(needle),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl text-ink-900">Orders</h1>
        <p className="text-sm text-ink-700">{orders.length} orders.</p>
      </header>
      <AdminFilterBar
        statusOptions={STATUS_OPTIONS}
        placeholder="Search by order id, name, or email"
      />
      <AdminTable<Order>
        columns={[
          {
            key: "id",
            header: "Order",
            cell: (o) => (
              <Link
                href={`/admin/orders/${o.id}`}
                className="font-mono text-ink-900 hover:text-accent-primary"
              >
                {o.id}
              </Link>
            ),
          },
          { key: "name", header: "Customer", cell: (o) => o.shippingAddress.fullName },
          { key: "items", header: "Items", align: "right", cell: (o) => o.items.length },
          {
            key: "total",
            header: "Total",
            align: "right",
            cell: (o) => formatRupees(o.totalPaise),
          },
          { key: "status", header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
          {
            key: "placed",
            header: "Placed",
            cell: (o) =>
              new Date(o.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
          },
        ]}
        rows={orders}
        getRowKey={(o) => o.id}
        emptyState={<p className="text-sm text-ink-500">No orders match these filters.</p>}
      />
    </div>
  );
}
```

`src/app/(admin)/admin/orders/[orderId]/page.tsx`:

Uses `ordersRepo.getById`, calls `notFound()` if missing. Renders a 2-column layout:

- Left: items list, OrderStatusTimeline (existing component from Phase 5), InternalNotes (new component below)
- Right: summary, shipping address, payment, OrderStatusActions

Components needed:

`src/components/admin/OrderStatusActions.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { refundOrderAction, updateOrderStatusAction } from "@/server/actions/admin-orders";
import type { OrderStatus } from "@/types/domain";

export function OrderStatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, startTransition] = useTransition();

  function set(next: OrderStatus) {
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, next);
        toast.success(`Marked as ${next}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function refund() {
    startTransition(async () => {
      try {
        await refundOrderAction(orderId);
        toast.success("Refund initiated (mock)");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending || status === "shipped"}
        onClick={() => set("shipped")}
        className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-700 disabled:opacity-50"
      >
        Mark shipped
      </button>
      <button
        type="button"
        disabled={pending || status === "delivered"}
        onClick={() => set("delivered")}
        className="rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:opacity-50"
      >
        Mark delivered
      </button>
      <button
        type="button"
        disabled={pending || status === "cancelled"}
        onClick={refund}
        className="rounded-sm border border-danger px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger hover:text-white disabled:opacity-50"
      >
        Cancel & refund
      </button>
    </div>
  );
}
```

`src/components/admin/InternalNotes.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addOrderNoteAction } from "@/server/actions/admin-orders";
import type { AdminOrderNote } from "@/types/domain";

export function InternalNotes({ orderId, notes }: { orderId: string; notes: AdminOrderNote[] }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    const trimmed = body.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        await addOrderNoteAction(orderId, trimmed);
        setBody("");
        toast.success("Note added");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-5">
      <h3 className="mb-3 font-display text-lg text-ink-900">Internal notes</h3>
      {notes.length === 0 ? (
        <p className="text-xs text-ink-500">No notes yet.</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-sm border border-ink-500/10 bg-bg-base p-3">
              <p className="text-sm text-ink-700">{n.body}</p>
              <p className="mt-2 text-xs text-ink-500">
                {n.authorName} · {new Date(n.createdAt).toLocaleString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex flex-col gap-2"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Add a note for the team…"
          className="w-full rounded-sm border border-ink-500/20 bg-bg-base p-3 text-sm focus:border-accent-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || body.trim().length === 0}
          className="self-start rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add note"}
        </button>
      </form>
    </div>
  );
}
```

Admin order detail page composes:

```tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import { ordersRepo } from "@/lib/db/repos/orders";
import { formatRupees } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/account/OrderStatusTimeline";
import { InternalNotes } from "@/components/admin/InternalNotes";
import { OrderStatusActions } from "@/components/admin/OrderStatusActions";
import { CartSummary } from "@/components/storefront/CartSummary";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = await ordersRepo.getById(orderId);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.id },
        ]}
      />
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">{order.id}</h1>
          <p className="text-sm text-ink-500">
            Placed {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-4 font-display text-xl text-ink-900">Status</h2>
            <OrderStatusTimeline status={order.status} />
          </section>
          <section>
            <h2 className="mb-4 font-display text-xl text-ink-900">Items</h2>
            <ul className="flex flex-col divide-y divide-ink-500/10 rounded-md border border-ink-500/10 bg-bg-elevated">
              {order.items.map((it) => (
                <li key={it.variantSku} className="flex items-start gap-4 p-4">
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
                  <div className="flex flex-1 flex-col text-sm">
                    <span className="font-medium text-ink-900">{it.productName}</span>
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
          <InternalNotes orderId={order.id} notes={order.internalNotes} />
        </div>
        <div className="flex flex-col gap-6">
          <OrderStatusActions orderId={order.id} status={order.status} />
          <CartSummary
            subtotalPaise={order.subtotalPaise}
            shippingPaise={order.shippingPaise}
            taxPaise={order.taxPaise}
            totalPaise={order.totalPaise}
          />
          <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-5">
            <h3 className="mb-2 font-display text-lg text-ink-900">Customer</h3>
            <p className="text-sm text-ink-700">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.email}
              <br />
              {order.shippingAddress.phone}
            </p>
            <h4 className="mt-4 text-xs uppercase tracking-wide text-ink-500">Ship to</h4>
            <p className="mt-1 text-sm text-ink-700">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.pincode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Commit: `feat(admin): orders list + detail with status, notes, refund`

---

## Task 11: Admin customers pages

`src/app/(admin)/admin/customers/page.tsx`:

```tsx
import Link from "next/link";
import { ordersRepo } from "@/lib/db/repos/orders";
import { usersRepo } from "@/lib/db/repos/users";
import { formatRupees } from "@/lib/money";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import type { User } from "@/types/domain";

export const metadata = { title: "Customers · Admin" };

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const customers = await usersRepo.listCustomers({ search: q });
  const allOrders = await ordersRepo.listAll();

  type Row = User & { orderCount: number; lifetimePaise: number };
  const rows: Row[] = customers.map((u) => {
    const userOrders = allOrders.filter((o) => o.userId === u.id);
    return {
      ...u,
      orderCount: userOrders.length,
      lifetimePaise: userOrders.reduce((s, o) => s + o.totalPaise, 0),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl text-ink-900">Customers</h1>
        <p className="text-sm text-ink-700">{rows.length} customers.</p>
      </header>
      <AdminFilterBar placeholder="Search by email or name" />
      <AdminTable<Row>
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (r) => (
              <Link
                href={`/admin/customers/${r.id}`}
                className="font-medium text-ink-900 hover:text-accent-primary"
              >
                {r.fullName}
              </Link>
            ),
          },
          { key: "email", header: "Email", cell: (r) => r.email },
          { key: "orders", header: "Orders", align: "right", cell: (r) => r.orderCount },
          {
            key: "spend",
            header: "Lifetime spend",
            align: "right",
            cell: (r) => formatRupees(r.lifetimePaise),
          },
          {
            key: "status",
            header: "",
            cell: (r) => (r.blocked ? <Badge tone="danger">Blocked</Badge> : null),
          },
        ]}
        rows={rows}
        getRowKey={(r) => r.id}
      />
    </div>
  );
}
```

`src/app/(admin)/admin/customers/[userId]/page.tsx`:

Server Component. Loads user, their orders, and renders profile + actions:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ordersRepo } from "@/lib/db/repos/orders";
import { usersRepo } from "@/lib/db/repos/users";
import { formatRupees } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { CustomerBlockButton } from "@/components/admin/CustomerBlockButton";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const user = await usersRepo.findById(userId);
  if (!user || user.role !== "customer") notFound();
  const orders = await ordersRepo.listByUser(user.id);
  const lifetime = orders.reduce((s, o) => s + o.totalPaise, 0);

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: user.fullName },
        ]}
      />
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl text-ink-900">{user.fullName}</h1>
          <p className="text-sm text-ink-500">{user.email}</p>
          {user.blocked && <Badge tone="danger">Blocked</Badge>}
        </div>
        <CustomerBlockButton userId={user.id} blocked={user.blocked} />
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-4">
          <div className="text-xs uppercase tracking-wide text-ink-500">Orders</div>
          <div className="mt-1 font-display text-2xl text-ink-900">{orders.length}</div>
        </div>
        <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-4">
          <div className="text-xs uppercase tracking-wide text-ink-500">Lifetime spend</div>
          <div className="mt-1 font-display text-2xl text-ink-900">{formatRupees(lifetime)}</div>
        </div>
        <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-4">
          <div className="text-xs uppercase tracking-wide text-ink-500">Joined</div>
          <div className="mt-1 font-display text-2xl text-ink-900">
            {new Date(user.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
      </section>
      <section>
        <h2 className="mb-4 font-display text-xl text-ink-900">Orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-ink-500">No orders yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-ink-500/10 rounded-md border border-ink-500/10 bg-bg-elevated">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between p-4">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="font-mono text-ink-900 hover:text-accent-primary"
                >
                  {o.id}
                </Link>
                <OrderStatusBadge status={o.status} />
                <span className="font-semibold tabular-nums text-ink-900">
                  {formatRupees(o.totalPaise)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

`src/components/admin/CustomerBlockButton.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { blockCustomerAction, unblockCustomerAction } from "@/server/actions/admin-customers";

export function CustomerBlockButton({ userId, blocked }: { userId: string; blocked: boolean }) {
  const [pending, startTransition] = useTransition();
  function toggle() {
    startTransition(async () => {
      try {
        if (blocked) {
          await unblockCustomerAction(userId);
          toast.success("Customer unblocked");
        } else {
          await blockCustomerAction(userId);
          toast.success("Customer blocked");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`rounded-sm px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
        blocked
          ? "bg-success text-white hover:bg-success/90"
          : "border border-danger text-danger hover:bg-danger hover:text-white"
      }`}
    >
      {pending ? "Working…" : blocked ? "Unblock" : "Block"}
    </button>
  );
}
```

Commit: `feat(admin): customers list + detail with block/unblock`

---

## Task 12: Admin coupons + banners pages

For both coupons and banners, build:

- List page with table + "New" CTA
- New page with form
- Edit page (by code or id) with form + delete button

### Coupons

`src/components/admin/CouponForm.tsx` — RHF + Zod:

Fields: code (required, uppercase auto-coerced), description, type select (percent/flat), value (number, percent shows "%", flat shows "₹"), minOrderPaise (₹ input), maxDiscountPaise (₹ input, only when type=percent), maxUses (int, optional), validFrom (date input), validTo (date input), status (active/paused).

On submit: convert ₹ to paise, ISO-format the dates, call `createCouponAction` or `updateCouponAction`.

### Banners

`src/components/admin/BannerForm.tsx` — RHF + Zod:

Fields: placement select (home-hero / home-strip / shop-strip), imageUrl, imageAlt, title, subtitle, ctaLabel, ctaHref, sortOrder (number), active (checkbox).

Shows live preview of the banner image.

### Pages

Six pages following the same shape as the Phase 6 products pages:

- `src/app/(admin)/admin/coupons/page.tsx` — list
- `src/app/(admin)/admin/coupons/new/page.tsx`
- `src/app/(admin)/admin/coupons/[code]/page.tsx`
- `src/app/(admin)/admin/banners/page.tsx`
- `src/app/(admin)/admin/banners/new/page.tsx`
- `src/app/(admin)/admin/banners/[bannerId]/page.tsx`

Each list page uses `AdminTable`. Each detail/edit page calls `notFound()` if the entity is missing.

Commit: `feat(admin): coupons + banners pages (list, new, edit)`

---

## Task 13: E2E

`tests/e2e/admin-rest.spec.ts` — 3-4 tests after signing in as the demo admin:

1. Visit `/admin/orders` and see the orders table (if no orders, that's fine — empty state is OK).
2. Visit `/admin/customers` and see the customers table.
3. Create a coupon: navigate to `/admin/coupons/new`, fill the form, submit, end up at `/admin/coupons/<code>`.
4. Block a customer: navigate to `/admin/customers`, click a customer, click Block, verify the badge appears.

Helper to log in as admin:

```ts
async function signInAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel(/^Email/i).fill("admin@example.com");
  await page.getByLabel(/^Password/i).fill("AdminDemo!23");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/admin(\?|$)/);
}
```

Commit: `test(e2e): admin orders, customers, coupons, banners`

---

## Task 14: Final verification + tag

```powershell
npx prettier --check .
npx eslint .
npx tsc --noEmit
npx vitest run
npx next build
npm run e2e
```

Tag `phase-7-complete` with deliverable summary.

---

## What's NOT in this phase

- **Coupon application at checkout** — backend phase.
- **Content (blog + static pages) + Settings** — Phase 8.
- **Bulk operations / CSV import** — out of scope.
- **Audit log persistence** — internal notes are the only audit surface; full audit log lands when real DDB is wired.

## Spec coverage (§12 admin minus content/settings)

- Orders list with filter + search ✓
- Orders detail with status timeline, status transitions, refund stub, internal notes ✓
- Customers list with search + KPI columns ✓
- Customers detail with orders + block/unblock ✓
- Coupons CRUD ✓
- Banners CRUD ✓
