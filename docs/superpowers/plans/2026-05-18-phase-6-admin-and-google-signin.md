# Phase 6 — Admin Shell + Products CRUD + Google Sign-In (mock)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open the admin experience (separate login at `/admin/login`, role-gated layout, dashboard, full Products CRUD with variants and images) and add a mocked "Continue with Google" flow on the customer auth pages.

**Architecture:** Admin lives under an `(admin)` route group **outside** `(storefront)` — no Header/Footer, its own dark sidebar shell. Admin auth uses the existing `usersRepo` + `sessionsRepo` with role gating at the layout (since middleware running in Edge can't import the Node-side repos). A seed function auto-creates one demo admin user on first access so the demo works without a manual bootstrap. Google sign-in is a UI-only mock: a "Sign in with Google" button opens a small picker modal with two demo accounts; selecting one calls a server action that upserts a `provider="google"` user (pre-verified email), creates a session, merges the guest cart, and redirects to `/account`. Real OAuth wires up in a later backend phase. The mutable Products store moves from the read-only `PRODUCTS_FIXTURE` to a `globalThis`-backed map seeded from the fixture on first access, so admin CRUD changes are reflected on the storefront in dev.

**Tech Stack:** No new dependencies. Continues using RHF + Zod for forms, sonner for toasts, MUI for the admin table where it earns its weight (or a hand-rolled table — see Task 12).

**Reference spec:** `docs/superpowers/specs/2026-05-16-saree-ecom-design.md` §6 (Admin/staff roles) and §12 (Admin Panel).

---

## File Map

```
✎ src/types/domain.ts                                       # add User.provider; add ProductDraft input type
✎ src/lib/db/repos/users.ts                                 # add findOrCreateGoogle, promoteToAdmin
✎ src/lib/db/repos/users.test.ts                            # tests for new methods
✎ src/lib/db/repos/products.ts                              # mutable store seeded from fixture + create/update/archive
✎ src/lib/db/repos/products.test.ts                         # CRUD tests
✚ src/lib/auth/admin-seed.ts                                # idempotent demo-admin seed (called from layout)
✚ src/server/actions/google-auth.ts                         # mock googleSignInAction
✚ src/server/actions/google-auth.test.ts
✚ src/server/actions/admin-auth.ts                          # adminLoginAction (role check)
✚ src/server/actions/admin-auth.test.ts
✚ src/server/actions/admin-products.ts                      # create/update/archive product
✚ src/server/actions/admin-products.test.ts
✚ src/components/auth/GoogleSignInButton.tsx                # button + picker modal (mock)
✎ src/components/auth/SignupForm.tsx                        # add divider + Google button
✎ src/components/auth/LoginForm.tsx                         # add divider + Google button
✎ src/components/auth/DemoNotice.tsx                        # mention Google demo accounts
✚ src/components/admin/AdminShell.tsx                       # sidebar + topbar layout
✚ src/components/admin/AdminLoginForm.tsx
✚ src/components/admin/ProductForm.tsx                      # create/edit
✚ src/components/admin/ProductVariantEditor.tsx
✚ src/components/admin/ProductImageEditor.tsx
✚ src/components/admin/AdminTable.tsx                       # generic sortable table primitive
✚ src/app/(admin)/admin/login/page.tsx                      # full-bleed admin login
✚ src/app/(admin)/admin/layout.tsx                          # role gate + shell
✚ src/app/(admin)/admin/page.tsx                            # KPI dashboard
✚ src/app/(admin)/admin/products/page.tsx                   # list
✚ src/app/(admin)/admin/products/new/page.tsx
✚ src/app/(admin)/admin/products/[productId]/page.tsx       # edit
✎ src/middleware.ts                                          # also match /admin (cookie presence only)
✚ tests/e2e/admin.spec.ts
```

Notes:

- `(admin)` route group sits at the **same level** as `(storefront)`. URLs are `/admin`, `/admin/login`, `/admin/products`, etc. — the group is invisible.
- Admin login lives at `/admin/login` outside the role gate; everything else inside `(admin)/admin/*` is role-gated by `(admin)/admin/layout.tsx`.
- The admin layout calls the seed function on every request (idempotent) so the demo admin user exists even after dev-mode restarts.
- Google sign-in mock uses two fixed demo accounts: `demo+priya@gmail.com` and `demo+anita@gmail.com`.

---

## Task 1: Extend types

Append to `src/types/domain.ts`:

```ts
export type AuthProvider = "email" | "google";
```

And modify the existing `User` interface — add a `provider` field. The current `User` definition lives in the file already; add `provider: AuthProvider;` right after `role: UserRole;`. Pre-existing users in mock data don't have this field; default it in code.

Commit: `feat(types): add AuthProvider and User.provider field`

---

## Task 2: usersRepo — Google upsert + admin promotion

In `src/lib/db/repos/users.ts`:

1. The `User` records created via `usersRepo.create` should default `provider: "email"`. Update the `create()` implementation:

   ```ts
   const user: User = {
     ...
     role: input.role ?? "customer",
     provider: input.provider ?? "email",
     ...
   };
   ```

   And add `provider?: AuthProvider` to `CreateUserInput`.

2. Add two new methods on `UsersRepo`:

   ```ts
   findOrCreateGoogle(input: { email: string; fullName: string }): Promise<User>;
   promoteToAdmin(id: string): Promise<User | null>;
   ```

   - `findOrCreateGoogle` looks up by email; if found, returns (without mutation). If not found, creates with `provider: "google"`, `emailVerified: true`, `passwordHash: ""` (no password for Google users).
   - `promoteToAdmin` sets `role: "admin"` on the user.

3. Add tests to `users.test.ts`:
   - `findOrCreateGoogle` creates a verified Google user when none exists.
   - `findOrCreateGoogle` returns the same user on repeat calls for the same email.
   - `promoteToAdmin` flips the role.

Run, confirm 7 passing (4 original + 3 new). Commit: `feat(repos): usersRepo Google upsert + admin promotion`

---

## Task 3: Mutable productsRepo

Currently `productsRepo` reads from the static `PRODUCTS_FIXTURE`. To support admin CRUD, move the store to a `globalThis`-backed mutable map seeded once from the fixture.

Replace the top of `src/lib/db/repos/products.ts`:

```ts
import { PRODUCTS_FIXTURE } from "@/lib/db/fixtures/products";
import type { ShopSort } from "@/lib/utils/shop-filters";
import type { Product } from "@/types/domain";

declare global {
  // eslint-disable-next-line no-var
  var __mockProducts: Map<string, Product> | undefined;
}

function getStore(): Map<string, Product> {
  if (globalThis.__mockProducts) return globalThis.__mockProducts;
  const store = new Map<string, Product>();
  for (const p of PRODUCTS_FIXTURE) store.set(p.id, p);
  globalThis.__mockProducts = store;
  return store;
}
```

Replace every reference to `PRODUCTS_FIXTURE` inside the repo with `[...getStore().values()]`. Then add three new methods to `ProductsRepo` interface and implementation:

```ts
create(input: ProductDraft): Promise<Product>;
update(id: string, input: Partial<ProductDraft>): Promise<Product | null>;
archive(id: string): Promise<Product | null>;
```

Define `ProductDraft` in this file (or in `src/types/domain.ts` — preferred):

```ts
export interface ProductDraft {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  priceInPaise: number;
  mrpInPaise: number;
  images: ProductImage[];
  variants: ProductVariant[];
  tags: string[];
  fabric: string;
  occasion: string[];
  featured: boolean;
  status: ProductStatus;
}
```

Implementation:

- `create`: assign `id = prd_<nanoid(12)>`, `createdAt = nowIso()`, store in map, return.
- `update`: merge over existing record, set new `createdAt` unchanged, return updated.
- `archive`: sets `status: "archived"`.

Add an `__resetProductsRepo` helper that clears the map and re-seeds from PRODUCTS_FIXTURE.

Append CRUD tests to `products.test.ts` inside the existing describe block:

- create returns a `prd_` id, ends up in `list()` if status active
- update modifies fields
- archive sets status to "archived" and the product is excluded from `list()`

Run, confirm all existing + 3 new tests passing. Commit: `feat(repos): productsRepo mutable store seeded from fixture + create/update/archive`

---

## Task 4: Admin seed helper

Create `src/lib/auth/admin-seed.ts`:

```ts
import { usersRepo } from "@/lib/db/repos/users";
import { hashPasswordStub } from "./passwords";

declare global {
  // eslint-disable-next-line no-var
  var __adminSeeded: boolean | undefined;
}

export const DEMO_ADMIN_EMAIL = "admin@example.com";
export const DEMO_ADMIN_PASSWORD = "AdminDemo!23";

export async function ensureDemoAdminSeeded(): Promise<void> {
  if (globalThis.__adminSeeded) return;
  const existing = await usersRepo.findByEmail(DEMO_ADMIN_EMAIL);
  if (existing) {
    if (existing.role !== "admin") {
      await usersRepo.promoteToAdmin(existing.id);
    }
    globalThis.__adminSeeded = true;
    return;
  }
  const passwordHash = await hashPasswordStub(DEMO_ADMIN_PASSWORD);
  const user = await usersRepo.create({
    email: DEMO_ADMIN_EMAIL,
    fullName: "Demo Admin",
    passwordHash,
  });
  await usersRepo.markEmailVerified(user.id);
  await usersRepo.promoteToAdmin(user.id);
  globalThis.__adminSeeded = true;
}
```

Commit: `feat(auth): add demo admin seed helper`

---

## Task 5: Google sign-in mock — server action + button

### `src/server/actions/google-auth.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { clearGuestSessionCookie } from "@/lib/cart/clear-guest-session";
import { ensureGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo } from "@/lib/db/repos/cart";
import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";

// Two fixed demo Google accounts. Real OAuth replaces this in a later phase.
export const DEMO_GOOGLE_ACCOUNTS = [
  { email: "demo+priya@gmail.com", fullName: "Priya Sharma" },
  { email: "demo+anita@gmail.com", fullName: "Anita Iyer" },
] as const;

export type DemoGoogleEmail = (typeof DEMO_GOOGLE_ACCOUNTS)[number]["email"];

export async function googleSignInAction(email: DemoGoogleEmail): Promise<void> {
  const account = DEMO_GOOGLE_ACCOUNTS.find((a) => a.email === email);
  if (!account) {
    throw new Error("Unknown demo Google account.");
  }
  const user = await usersRepo.findOrCreateGoogle({
    email: account.email,
    fullName: account.fullName,
  });
  const session = await sessionsRepo.create(user.id);
  await setSessionCookie(session.id);

  // Merge guest cart if present, then clear the guest cookie.
  const guestSessionId = await ensureGuestSessionId();
  if (guestSessionId) {
    await cartRepo.mergeGuestIntoUser(guestSessionId, user.id);
    await clearGuestSessionCookie();
  }
  revalidatePath("/", "layout");
  redirect("/account");
}
```

Add a unit test `google-auth.test.ts` (same vi.hoisted/mock pattern as Phase 4 auth):

- googleSignInAction creates a session for a demo email.
- googleSignInAction returning a known email twice yields one user.

### `src/components/auth/GoogleSignInButton.tsx`

A client component that renders a "Continue with Google" button. On click, opens a small in-app picker modal (use the existing `Sheet` primitive or roll a tiny modal). The picker shows two demo accounts. Selecting an account calls `googleSignInAction(email)`.

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import {
  DEMO_GOOGLE_ACCOUNTS,
  googleSignInAction,
  type DemoGoogleEmail,
} from "@/server/actions/google-auth";
import { Sheet } from "@/components/ui/Sheet";

export function GoogleSignInButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function pick(email: DemoGoogleEmail) {
    setOpen(false);
    startTransition(async () => {
      try {
        await googleSignInAction(email);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error("Google sign-in failed. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={clsx(
          "inline-flex w-full items-center justify-center gap-3 rounded-sm border border-ink-500/30 bg-bg-elevated px-4 py-3 text-sm font-medium text-ink-900 transition hover:border-ink-700",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <GoogleLogoSvg />
        Continue with Google
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title="Choose a demo Google account"
      >
        <div className="flex flex-col gap-2 pb-4">
          <p className="text-xs text-ink-500">
            Demo mode: real Google OAuth wires up in a later phase. Pick a demo account to continue.
          </p>
          {DEMO_GOOGLE_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => pick(acc.email)}
              className="flex items-center gap-3 rounded-sm border border-ink-500/15 bg-bg-base p-4 text-left transition hover:border-ink-700"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary/10 text-sm font-semibold text-accent-primary">
                {acc.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <span className="flex flex-col">
                <span className="font-medium text-ink-900">{acc.fullName}</span>
                <span className="text-xs text-ink-500">{acc.email}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}

function GoogleLogoSvg() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.5-1.6 4.4-5.5 4.4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.7 14.6 2.7 12 2.7 6.9 2.7 2.8 6.9 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}
```

### Add Google button to SignupForm and LoginForm

Edit `src/components/auth/SignupForm.tsx`. Just below the `<button type="submit">` element (closing the form), add:

```tsx
<div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wide text-ink-500">
  <span className="h-px flex-1 bg-ink-500/15" />
  Or
  <span className="h-px flex-1 bg-ink-500/15" />
</div>
<GoogleSignInButton />
```

And import `GoogleSignInButton` at the top. Do the same edit to `LoginForm.tsx`.

### Update DemoNotice

In `src/components/auth/DemoNotice.tsx` mention the Google demo accounts. Adjust the existing copy to read approximately:

> "Demo mode: the verification code is 123456. Google sign-in shows demo accounts. Real bcrypt, email delivery, and Google OAuth wire up in a later phase."

Commit: `feat(auth): mock Google sign-in (button, picker, server action)`

---

## Task 6: Admin login

### Server action `src/server/actions/admin-auth.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyPasswordStub } from "@/lib/auth/passwords";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";

export interface AdminLoginInput {
  email: string;
  password: string;
}

export async function adminLoginAction(input: AdminLoginInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (!user) throw new Error("Email or password is incorrect.");
  const ok = await verifyPasswordStub(input.password, user.passwordHash);
  if (!ok) throw new Error("Email or password is incorrect.");
  if (user.role !== "admin" && user.role !== "staff") {
    throw new Error("This account does not have admin access.");
  }
  if (!user.emailVerified) {
    // Force-verify staff/admin users on first login so the demo works
    // even when the seed bypasses the OTP step.
    await usersRepo.markEmailVerified(user.id);
  }
  const session = await sessionsRepo.create(user.id);
  await setSessionCookie(session.id);
  revalidatePath("/", "layout");
  redirect("/admin");
}
```

Add tests for: success path (admin user), wrong password, role rejection (customer can't log in to admin).

### Admin login form `src/components/admin/AdminLoginForm.tsx`

Same shape as `LoginForm.tsx` but calls `adminLoginAction`. No "Forgot password?" link, no Google button.

### Admin login page `src/app/(admin)/admin/login/page.tsx`

Full-bleed dark-ink layout. Renders the `AdminLoginForm`. Inside the form section, show a small demo-mode hint card listing the demo admin credentials (email `admin@example.com`, password `AdminDemo!23`). Trigger `ensureDemoAdminSeeded()` server-side at the top of the page so the demo credentials always work.

```tsx
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  ensureDemoAdminSeeded,
} from "@/lib/auth/admin-seed";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = { title: "Admin sign in · Saree Store" };

export default async function AdminLoginPage() {
  await ensureDemoAdminSeeded();
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-900 p-6">
      <div className="w-full max-w-md rounded-md bg-bg-elevated p-8">
        <header className="flex flex-col gap-2 pb-6">
          <span className="text-xs uppercase tracking-[0.25em] text-accent-gold">Admin</span>
          <h1 className="font-display text-3xl text-ink-900">Sign in to manage your store</h1>
        </header>
        <div className="mb-6 rounded-sm border border-accent-gold/40 bg-accent-gold/10 p-3 text-xs text-ink-700">
          Demo credentials —
          <br />
          <span className="font-mono text-ink-900">{DEMO_ADMIN_EMAIL}</span>
          <br />
          <span className="font-mono text-ink-900">{DEMO_ADMIN_PASSWORD}</span>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
```

Commit: `feat(admin): admin login page + action with role gate + demo seed`

---

## Task 7: Admin layout (role gate + AdminShell)

### Update middleware

Add `/admin` to the matcher in `src/middleware.ts`:

```ts
export const config = {
  matcher: ["/account/:path*", "/admin/((?!login).*)"],
};
```

The regex `/admin/((?!login).*)` matches `/admin/*` but NOT `/admin/login`. The middleware still only verifies session cookie presence; role checking happens in the layout.

### `src/components/admin/AdminShell.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Banknote,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Tag,
  UsersRound,
} from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { logoutAction } from "@/server/actions/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Banknote },
  { href: "/admin/customers", label: "Customers", icon: UsersRound },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export interface AdminShellProps {
  userName: string;
  userEmail: string;
  children: ReactNode;
}

export function AdminShell({ userName, userEmail, children }: AdminShellProps) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col bg-ink-900 text-bg-base">
          <div className="flex flex-col gap-1 px-6 py-6">
            <span className="text-xs uppercase tracking-[0.25em] text-accent-gold">Admin</span>
            <Link href="/" className="font-display text-2xl">
              Saree Store
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3">
            {NAV.map((item) => {
              const active =
                item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "inline-flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition",
                    active
                      ? "bg-bg-base/10 text-bg-base"
                      : "text-bg-base/70 hover:bg-bg-base/5 hover:text-bg-base",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-bg-base/10 px-6 py-4 text-xs">
            <p className="font-medium text-bg-base">{userName}</p>
            <p className="text-bg-base/60">{userEmail}</p>
            <form action={logoutAction} className="mt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-bg-base/70 transition hover:text-bg-base"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </aside>
        <main className="px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
```

### `src/app/(admin)/admin/layout.tsx`

```tsx
import { redirect } from "next/navigation";
import { ensureDemoAdminSeeded } from "@/lib/auth/admin-seed";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureDemoAdminSeeded();
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin" && user.role !== "staff") {
    redirect("/admin/login?error=forbidden");
  }
  return (
    <AdminShell userName={user.fullName} userEmail={user.email}>
      {children}
    </AdminShell>
  );
}
```

> **Important**: this layout sits at `(admin)/admin/layout.tsx`. Because `/admin/login/page.tsx` is at `(admin)/admin/login/page.tsx`, it would also be wrapped by this layout — which would redirect logged-out users back to `/admin/login` infinitely. Avoid that by **moving the admin/login route outside the (admin) group** OR adding a small "skip layout if pathname is /admin/login" check.
>
> The clean fix: move `src/app/(admin)/admin/login/page.tsx` to `src/app/admin-login/page.tsx`, then update the redirects in the layout/action to `/admin-login`. Alternatively make `admin/login/layout.tsx` an empty pass-through layout that doesn't gate. Choose the simpler one. **Pick the pass-through layout approach**: create `src/app/(admin)/admin/login/layout.tsx` with:
>
> ```tsx
> export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
>   return <>{children}</>;
> }
> ```
>
> Wait — sub-layouts inherit parent layouts in Next.js, so this wouldn't bypass the parent. To genuinely exclude `/admin/login` from the gate, the cleanest path is to keep the URL `/admin/login` but place the page **outside** the `(admin)` group: create `src/app/admin/login/page.tsx` (no group) and **only** put the protected routes under `(admin)`. Reorganise:
>
> - `src/app/admin/login/page.tsx` — public admin login (the file you'd write per Task 6)
> - `src/app/(admin)/admin/layout.tsx` — protected layout (this Task 7's file)
> - `src/app/(admin)/admin/page.tsx` — dashboard (next task)
> - `src/app/(admin)/admin/products/...` — products pages
>
> Both `app/admin/login/page.tsx` and `app/(admin)/admin/page.tsx` resolve URL `/admin/login` and `/admin` respectively without conflict because the group `(admin)` is invisible in the URL but distinct in the file system. Use this layout — it's the documented Next.js pattern.

Commit: `feat(admin): protected (admin) layout with role gate and AdminShell sidebar`

---

## Task 8: Admin dashboard

`src/app/(admin)/admin/page.tsx`:

```tsx
import { Package, ShoppingBag, UsersRound, Wallet } from "lucide-react";
import { ordersRepo } from "@/lib/db/repos/orders";
import { productsRepo } from "@/lib/db/repos/products";
import { formatRupees } from "@/lib/money";

export const metadata = { title: "Dashboard · Admin" };

export default async function AdminDashboardPage() {
  const allProducts = await productsRepo.list();
  // ordersRepo currently has no listAll; for KPIs, expose via a quick scan.
  // Easiest path: add listAll method now. See note below.
  const allOrders = await listAllOrders();

  const revenuePaise = allOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const uniqueCustomers = new Set(allOrders.map((o) => o.userId ?? o.guestSessionId)).size;

  const tiles = [
    { label: "Active products", value: allProducts.length.toString(), icon: Package },
    { label: "Total orders", value: allOrders.length.toString(), icon: ShoppingBag },
    { label: "Total revenue", value: formatRupees(revenuePaise), icon: Wallet },
    { label: "Unique customers", value: uniqueCustomers.toString(), icon: UsersRound },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-700">Quick overview of the store.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="rounded-md border border-ink-500/10 bg-bg-elevated p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500">
                <Icon className="h-4 w-4" /> {t.label}
              </div>
              <div className="mt-2 font-display text-2xl text-ink-900">{t.value}</div>
            </div>
          );
        })}
      </section>
      <section>
        <h2 className="mb-4 font-display text-xl text-ink-900">Recent orders</h2>
        {allOrders.length === 0 ? (
          <p className="text-sm text-ink-500">No orders yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-ink-500/10 rounded-md border border-ink-500/10 bg-bg-elevated">
            {allOrders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="font-mono text-sm text-ink-900">{o.id}</span>
                  <span className="text-xs text-ink-500">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {o.items.length} items
                  </span>
                </div>
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

async function listAllOrders() {
  const { ordersRepo } = await import("@/lib/db/repos/orders");
  if ("listAll" in ordersRepo && typeof ordersRepo.listAll === "function") {
    return (
      ordersRepo as unknown as {
        listAll: () => Promise<
          Awaited<ReturnType<typeof ordersRepo.getById>> extends infer T ? NonNullable<T>[] : never
        >;
      }
    ).listAll();
  }
  return [];
}
```

The `listAllOrders` helper degrades gracefully if `ordersRepo.listAll` doesn't exist yet. To make this clean, add `listAll` to `ordersRepo`:

In `src/lib/db/repos/orders.ts`, add to `OrdersRepo`:

```ts
listAll(): Promise<Order[]>;
```

And implement:

```ts
async listAll() {
  return [...orders.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
```

Then simplify the dashboard page to just call `ordersRepo.listAll()` directly, drop the conditional helper. Final dashboard:

```tsx
const [allProducts, allOrders] = await Promise.all([productsRepo.list(), ordersRepo.listAll()]);
```

Commit: `feat(admin): admin dashboard with KPIs and recent orders`

---

## Task 9: AdminTable primitive

`src/components/admin/AdminTable.tsx` — a generic table primitive used by Products list (and later, Orders, Customers, etc.).

```tsx
import type { ReactNode } from "react";
import { clsx } from "@/lib/utils/clsx";

export interface AdminColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  width?: string;
}

export interface AdminTableProps<T> {
  columns: AdminColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyState?: ReactNode;
}

export function AdminTable<T>({ columns, rows, getRowKey, emptyState }: AdminTableProps<T>) {
  if (rows.length === 0 && emptyState) return <>{emptyState}</>;
  return (
    <div className="overflow-x-auto rounded-md border border-ink-500/10 bg-bg-elevated">
      <table className="min-w-full divide-y divide-ink-500/10 text-sm">
        <thead className="bg-bg-base/40">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={clsx(
                  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-500",
                  col.align === "right" ? "text-right" : "text-left",
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-500/10">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="transition hover:bg-bg-base/30">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(
                    "px-4 py-3 text-ink-700",
                    col.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Commit: `feat(admin): add AdminTable primitive`

---

## Task 10: Products CRUD server actions (TDD)

`src/server/actions/admin-products.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { productsRepo } from "@/lib/db/repos/products";
import type { ProductDraft } from "@/types/domain";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    throw new Error("Admin access required.");
  }
  return user;
}

export async function createProductAction(input: ProductDraft): Promise<void> {
  await requireAdmin();
  const product = await productsRepo.create(input);
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProductAction(id: string, input: Partial<ProductDraft>): Promise<void> {
  await requireAdmin();
  await productsRepo.update(id, input);
  revalidatePath("/", "layout");
  revalidatePath(`/admin/products/${id}`);
}

export async function archiveProductAction(id: string): Promise<void> {
  await requireAdmin();
  await productsRepo.archive(id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
}
```

Tests: mock `getCurrentUser`, `next/cache`, `next/navigation`. Verify create / update / archive happy paths, plus access denied when role is "customer".

Commit: `feat(actions): admin product CRUD server actions with role gate`

---

## Task 11: Product form components

Three components:

### `src/components/admin/ProductVariantEditor.tsx`

Client component. Props: `value: ProductVariant[]` and `onChange: (next: ProductVariant[]) => void`. Renders an editable list of variants. Each row has inputs for SKU, colour name (text), colour hex (a `<input type="color">`), optional size (text), stock (number). A "+ Add variant" button appends a new empty row. Each row has a trash button to remove.

### `src/components/admin/ProductImageEditor.tsx`

Client component. Props: `value: ProductImage[]` and `onChange: (next: ProductImage[]) => void`. Renders text inputs for URL and alt for each image, with up/down reorder buttons and a remove button. "+ Add image" appends an empty row. (Real S3 upload comes later — for now URL input is enough.)

### `src/components/admin/ProductForm.tsx`

The big form. Uses RHF + Zod for primitive fields (name/slug/prices/category/etc.) and the two editors above for arrays. On submit, calls `createProductAction` or `updateProductAction`. Fields:

- Name, Slug (auto-slugify from name on blur but allow override), Description (textarea), Category (Select using `categoriesRepo.list()` server-passed in via prop), Price (₹ input, multiplied to paise on submit), MRP (same), Fabric, Tags (comma-separated input parsed to array), Occasion (comma-separated input parsed to array), Featured (checkbox), Status (select: draft/active/archived), Variants (ProductVariantEditor), Images (ProductImageEditor).

Sketch (omitting the obvious RHF boilerplate; agent should follow the same pattern as `AddressForm.tsx` from Phase 3/5):

```tsx
"use client";

// ... imports for RHF, Zod, FormField, Input, Select, the two editors, toast, useTransition

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  categorySlug: z.string().min(1),
  priceRupees: z.coerce.number().int().nonnegative(),
  mrpRupees: z.coerce.number().int().nonnegative(),
  fabric: z.string().min(2),
  tagsCsv: z.string().optional(),
  occasionCsv: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
});

// Form merges the parsed values + variants + images into ProductDraft (multiplying rupees → paise) and calls the action.
```

Use this final shape (omitting boilerplate around it):

```tsx
async function onSubmit(values: z.infer<typeof productSchema>) {
  const draft: ProductDraft = {
    name: values.name,
    slug: values.slug,
    description: values.description,
    categorySlug: values.categorySlug,
    priceInPaise: values.priceRupees * 100,
    mrpInPaise: values.mrpRupees * 100,
    fabric: values.fabric,
    tags: (values.tagsCsv ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    occasion: (values.occasionCsv ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    featured: values.featured,
    status: values.status,
    variants,
    images,
  };
  startTransition(async () => {
    try {
      if (editId) {
        await updateProductAction(editId, draft);
        toast.success("Product saved");
      } else {
        await createProductAction(draft);
        // createProductAction redirects to edit page; toast happens before redirect throws
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    }
  });
}
```

Commit: `feat(admin): add ProductForm + variant + image editors`

---

## Task 12: Products list page

`src/app/(admin)/admin/products/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { productsRepo } from "@/lib/db/repos/products";
import { formatRupees } from "@/lib/money";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import type { Product } from "@/types/domain";

export const metadata = { title: "Products · Admin" };

const columns: AdminColumn<Product>[] = [
  {
    key: "image",
    header: "",
    width: "64px",
    cell: (p) => (
      <div className="relative h-12 w-10 overflow-hidden rounded-sm bg-ink-500/5">
        {p.images[0] && (
          <Image
            src={p.images[0].url}
            alt={p.images[0].alt}
            fill
            sizes="40px"
            className="object-cover"
          />
        )}
      </div>
    ),
  },
  {
    key: "name",
    header: "Name",
    cell: (p) => (
      <Link
        href={`/admin/products/${p.id}`}
        className="font-medium text-ink-900 hover:text-accent-primary"
      >
        {p.name}
      </Link>
    ),
  },
  { key: "category", header: "Category", cell: (p) => p.categorySlug },
  { key: "price", header: "Price", align: "right", cell: (p) => formatRupees(p.priceInPaise) },
  {
    key: "stock",
    header: "Stock",
    align: "right",
    cell: (p) => p.variants.reduce((n, v) => n + v.stock, 0),
  },
  {
    key: "status",
    header: "Status",
    cell: (p) => (
      <Badge
        tone={p.status === "active" ? "success" : p.status === "draft" ? "neutral" : "warning"}
      >
        {p.status}
      </Badge>
    ),
  },
];

export default async function AdminProductsPage() {
  const products = await productsRepo.listAll({ includeArchived: true });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Products</h1>
          <p className="text-sm text-ink-700">{products.length} products in store.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
        >
          <Plus className="h-4 w-4" /> New product
        </Link>
      </header>
      <AdminTable columns={columns} rows={products} getRowKey={(p) => p.id} />
    </div>
  );
}
```

> `productsRepo.listAll({ includeArchived: true })` doesn't exist yet. Add it to the repo:
>
> ```ts
> listAll(options?: { includeArchived?: boolean }): Promise<Product[]>;
> ```
>
> Implementation: returns `[...getStore().values()]` (no active filter), optionally filtering out archived. Default `includeArchived: false` → returns active + draft only.

Add a quick unit test ensuring `listAll({ includeArchived: true })` returns archived products too.

Commit: `feat(admin): products list page with image, status, totals`

---

## Task 13: New + Edit product pages

`src/app/(admin)/admin/products/new/page.tsx`:

```tsx
import { categoriesRepo } from "@/lib/db/repos/categories";
import { ProductForm } from "@/components/admin/ProductForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata = { title: "New product · Admin" };

export default async function NewProductPage() {
  const categories = await categoriesRepo.list();
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: "New" },
        ]}
      />
      <header>
        <h1 className="font-display text-3xl text-ink-900">New product</h1>
      </header>
      <ProductForm categories={categories} />
    </div>
  );
}
```

`src/app/(admin)/admin/products/[productId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { productId } = await params;
  const [product, categories] = await Promise.all([
    productsRepo.getById(productId),
    categoriesRepo.list(),
  ]);
  if (!product) notFound();
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: product.name },
        ]}
      />
      <header>
        <h1 className="font-display text-3xl text-ink-900">Edit · {product.name}</h1>
      </header>
      <ProductForm categories={categories} editId={product.id} defaultProduct={product} />
    </div>
  );
}
```

`productsRepo.getById` already exists. If not (only `getBySlug` exists), add it.

Commit: `feat(admin): new and edit product pages`

---

## Task 14: E2E admin flow

`tests/e2e/admin.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.describe("Admin flow", () => {
  test("admin can sign in and reach the dashboard", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/^Email/i).fill("admin@example.com");
    await page.getByLabel(/^Password/i).fill("AdminDemo!23");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/admin(\?|$)/);
    await expect(page.getByRole("heading", { level: 1, name: /Dashboard/ })).toBeVisible();
  });

  test("customer cannot reach /admin (redirected to /admin/login)", async ({ page }) => {
    // Sign up + verify as a customer
    const email = `customer+${Date.now()}@example.com`;
    await page.goto("/auth/signup");
    await page.getByLabel(/Full name/i).fill("Customer Test");
    await page.getByLabel(/^Email/i).fill(email);
    await page.getByLabel(/^Password/i).fill("Hunter22!");
    await page.getByRole("button", { name: /Create account/i }).click();
    const digits = page.getByLabel(/^Digit \d$/);
    for (let i = 0; i < 6; i++) await digits.nth(i).fill("123456"[i]!);
    await page.getByRole("button", { name: /Verify and continue/i }).click();
    await expect(page).toHaveURL(/\/account(\?|$)/);

    // Try to reach /admin — should bounce to /admin/login (middleware first redirects to /auth/login? No — admin routes' middleware uses cookie presence; customer has a session cookie, so middleware lets it through; the (admin) layout then enforces role and redirects to /admin/login?error=forbidden)
    const res = await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    expect(res?.status()).toBeLessThan(400);
  });

  test("Google sign-in mock signs the user in via the picker", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("button", { name: /Continue with Google/i }).click();
    await page.getByRole("button", { name: /Priya Sharma/ }).click();
    await expect(page).toHaveURL(/\/account(\?|$)/);
  });
});
```

Commit: `test(e2e): admin login, customer denied, Google sign-in mock`

---

## Task 15: Final verification + tag

```powershell
npx prettier --check .
npx eslint .
npx tsc --noEmit
npx vitest run
npx next build
npm run e2e
```

Tag: `phase-6-complete` with a summary message listing the deliverables (admin login + shell + dashboard + Products CRUD + Google sign-in mock + admin seed + admin middleware match).

---

## What's NOT in this phase

- **Tiptap rich-text** for product description — deferred. Description stays as plain text for now.
- **Real S3 upload** for product images — deferred. Images use URL inputs.
- **Admin orders / customers / coupons / banners / content / settings** — Phase 7 (the original sub-plan for the remainder of admin).
- **Real Google OAuth** — backend phase via Auth.js or custom flow. The mock keeps the user surface fully clickable until then.

## Spec coverage (§6 admin auth, §12 admin panel — Products only)

- Admin login at `/admin/login` ✓
- Role-gated `/admin/*` via layout ✓
- Admin sidebar shell ✓
- Dashboard with KPIs ✓
- Products list with image + status ✓
- Products create / edit (name, slug, prices, fabric, category, tags, occasion, featured, status, variants, images) ✓
- Archive product ✓
- Audit log — deferred to a later phase (will piggyback on backend integration).
- Bulk operations, CSV import, Tiptap — deferred.
