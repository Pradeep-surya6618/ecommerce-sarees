# Phase 4 — Auth UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the full authentication UI flow — signup → email-OTP verification → login → forgot-password → session cookie, plus header awareness, route protection middleware, and guest→user cart merge on login. All wired through Server Actions backed by mock user/session repositories; real bcrypt, JWT signing, email sending, and rate limiting land in a later backend phase.

**Architecture:** Users and Sessions live in mock repositories (in-memory `Map`) with the same async signatures the eventual DynamoDB repos will have. Passwords are stored as a deterministic stub hash and OTPs are always the literal **`123456`** in this phase — explicit demo-mode constants, no real cryptography. Sessions are tracked via a `session_id` httpOnly cookie. Middleware at `src/middleware.ts` reads the cookie and protects `/account/*` routes. On successful login, any guest cart attached to the `gs_session` cookie merges into the user's cart, the guest cart is cleared, and the `gs_session` cookie is dropped.

**Tech Stack:** Same as Phases 1–3. No new dependencies. React Hook Form + Zod for forms. `sonner` for toasts. Next 16 Server Actions and middleware.

**Reference spec:** `docs/superpowers/specs/2026-05-16-saree-ecom-design.md` §6 (Authentication). Real-crypto bits (bcrypt, jose JWT, SES OTP delivery, rate limits) deferred to a later phase.

---

## File Map

```
✎ src/types/domain.ts                                  # add User, UserRole, Session, OtpPurpose
✚ src/lib/db/repos/users.ts                            # mock usersRepo
✚ src/lib/db/repos/users.test.ts
✚ src/lib/db/repos/sessions.ts                         # mock sessionsRepo
✚ src/lib/db/repos/sessions.test.ts
✚ src/lib/db/repos/otps.ts                             # mock otpsRepo
✚ src/lib/db/repos/otps.test.ts
✚ src/lib/auth/passwords.ts                            # stub hash + verify (NOT real bcrypt)
✚ src/lib/auth/otp.ts                                  # generate + verify OTP (always 123456)
✚ src/lib/auth/session-cookie.ts                       # session_id cookie helpers
✚ src/lib/auth/current-user.ts                         # getCurrentUser (read-only)
✎ src/lib/db/repos/cart.ts                              # add getOrCreateForUser + mergeGuestIntoUser
✎ src/lib/db/repos/cart.test.ts                         # tests for new methods
✚ src/server/actions/auth.ts                           # signup/verifyOtp/login/logout/forgot/reset
✚ src/server/actions/auth.test.ts
✚ src/middleware.ts                                    # /account/* protection
✚ src/components/ui/PasswordInput.tsx                  # password field with show/hide toggle
✚ src/components/ui/OtpInput.tsx                       # 6-digit otp entry
✚ src/components/ui/OtpInput.test.tsx
✚ src/components/auth/SignupForm.tsx
✚ src/components/auth/LoginForm.tsx
✚ src/components/auth/OtpForm.tsx
✚ src/components/auth/PasswordResetRequestForm.tsx
✚ src/components/auth/PasswordResetForm.tsx
✚ src/components/auth/AuthCard.tsx                     # shared shell (logo, title, footer link)
✚ src/components/auth/DemoNotice.tsx                   # banner telling users the OTP is 123456
✚ src/app/(storefront)/auth/signup/page.tsx
✚ src/app/(storefront)/auth/verify/page.tsx
✚ src/app/(storefront)/auth/login/page.tsx
✚ src/app/(storefront)/auth/forgot-password/page.tsx
✚ src/app/(storefront)/auth/reset-password/page.tsx
✚ src/app/(storefront)/account/page.tsx                # protected placeholder dashboard
✎ src/components/shared/Header.tsx                     # auth-aware account/sign-in links
✚ tests/e2e/auth.spec.ts
```

Notes:

- Mock-only flows. Phase notes call out exactly where real crypto/email/limits go in later phases.
- Session cookie: `session_id` httpOnly + Secure (prod) + SameSite=Lax, 30-day max-age.
- Demo OTP: `123456`. Hard-coded constant exported from `src/lib/auth/otp.ts`.

---

## Task 1: Extend domain types (User, Session, OTP purpose)

**File:** modify `src/types/domain.ts` (append at the end).

- [ ] **Step 1: Append**

```ts
export type UserRole = "customer" | "staff" | "admin";

export interface User {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  emailVerified: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export type OtpPurpose = "signup" | "password-reset";

export interface OtpRecord {
  id: string;
  email: string;
  purpose: OtpPurpose;
  code: string;
  expiresAt: string;
  consumedAt: string | null;
}
```

- [ ] **Step 2: Typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```powershell
git add src/types/domain.ts
git commit -m "feat(types): add User, Session, OTP domain types"
```

---

## Task 2: usersRepo (mock, TDD)

**Files:** `src/lib/db/repos/users.ts`, `src/lib/db/repos/users.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { __resetUsersRepo, usersRepo } from "./users";

describe("usersRepo (mock)", () => {
  beforeEach(() => __resetUsersRepo());

  it("creates a user and finds it by email (case-insensitive)", async () => {
    const created = await usersRepo.create({
      email: "Aishwarya@example.com",
      fullName: "Aishwarya R.",
      passwordHash: "hash:secret",
    });
    expect(created.id).toMatch(/^usr_/);
    expect(created.email).toBe("aishwarya@example.com");
    expect(created.role).toBe("customer");
    expect(created.emailVerified).toBe(false);

    const found = await usersRepo.findByEmail("AISHWARYA@example.com");
    expect(found?.id).toBe(created.id);
  });

  it("throws when creating with a duplicate email", async () => {
    await usersRepo.create({
      email: "a@example.com",
      fullName: "A",
      passwordHash: "h",
    });
    await expect(
      usersRepo.create({ email: "a@example.com", fullName: "A2", passwordHash: "h2" }),
    ).rejects.toThrow(/already/i);
  });

  it("marks email verified", async () => {
    const user = await usersRepo.create({
      email: "v@example.com",
      fullName: "V",
      passwordHash: "h",
    });
    const updated = await usersRepo.markEmailVerified(user.id);
    expect(updated?.emailVerified).toBe(true);
  });

  it("updates password hash", async () => {
    const user = await usersRepo.create({
      email: "p@example.com",
      fullName: "P",
      passwordHash: "old",
    });
    const updated = await usersRepo.updatePasswordHash(user.id, "new");
    expect(updated?.passwordHash).toBe("new");
  });
});
```

- [ ] **Step 2: Run, confirm 4 failing**

```powershell
npx vitest run src/lib/db/repos/users.test.ts
```

- [ ] **Step 3: Implement `src/lib/db/repos/users.ts`**

```ts
import { nanoid } from "nanoid";
import type { User, UserRole } from "@/types/domain";

export interface CreateUserInput {
  email: string;
  fullName: string;
  passwordHash: string;
  role?: UserRole;
}

export interface UsersRepo {
  create(input: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  markEmailVerified(id: string): Promise<User | null>;
  updatePasswordHash(id: string, passwordHash: string): Promise<User | null>;
}

const users = new Map<string, User>();
const byEmail = new Map<string, string>();

function nowIso(): string {
  return new Date().toISOString();
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const usersRepo: UsersRepo = {
  async create(input) {
    const email = normaliseEmail(input.email);
    if (byEmail.has(email)) {
      throw new Error("A user with this email already exists.");
    }
    const now = nowIso();
    const user: User = {
      id: `usr_${nanoid(12)}`,
      email,
      fullName: input.fullName,
      passwordHash: input.passwordHash,
      emailVerified: false,
      role: input.role ?? "customer",
      createdAt: now,
      updatedAt: now,
    };
    users.set(user.id, user);
    byEmail.set(email, user.id);
    return user;
  },

  async findByEmail(email) {
    const id = byEmail.get(normaliseEmail(email));
    return id ? (users.get(id) ?? null) : null;
  },

  async findById(id) {
    return users.get(id) ?? null;
  },

  async markEmailVerified(id) {
    const user = users.get(id);
    if (!user) return null;
    user.emailVerified = true;
    user.updatedAt = nowIso();
    return user;
  },

  async updatePasswordHash(id, passwordHash) {
    const user = users.get(id);
    if (!user) return null;
    user.passwordHash = passwordHash;
    user.updatedAt = nowIso();
    return user;
  },
};

export function __resetUsersRepo(): void {
  users.clear();
  byEmail.clear();
}
```

- [ ] **Step 4: Run, confirm 4 passing**

```powershell
npx vitest run src/lib/db/repos/users.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/lib/db/repos/users.ts src/lib/db/repos/users.test.ts
git commit -m "feat(repos): add mock usersRepo with create/findByEmail/verify/updatePassword"
```

---

## Task 3: sessionsRepo (mock, TDD)

**Files:** `src/lib/db/repos/sessions.ts`, `src/lib/db/repos/sessions.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { __resetSessionsRepo, sessionsRepo } from "./sessions";

describe("sessionsRepo (mock)", () => {
  beforeEach(() => __resetSessionsRepo());

  it("creates a session and retrieves it by id", async () => {
    const s = await sessionsRepo.create("usr_x");
    expect(s.id).toMatch(/^sess_/);
    expect(s.userId).toBe("usr_x");
    const found = await sessionsRepo.findById(s.id);
    expect(found?.id).toBe(s.id);
  });

  it("deletes a session", async () => {
    const s = await sessionsRepo.create("usr_x");
    await sessionsRepo.deleteById(s.id);
    expect(await sessionsRepo.findById(s.id)).toBeNull();
  });

  it("treats expired sessions as not found", async () => {
    const s = await sessionsRepo.create("usr_x", { ttlSeconds: -10 });
    expect(await sessionsRepo.findById(s.id)).toBeNull();
  });
});
```

- [ ] **Step 2: Run, confirm 3 failing**

- [ ] **Step 3: Implement `src/lib/db/repos/sessions.ts`**

```ts
import { nanoid } from "nanoid";
import type { Session } from "@/types/domain";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30;

export interface CreateSessionOptions {
  ttlSeconds?: number;
}

export interface SessionsRepo {
  create(userId: string, options?: CreateSessionOptions): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  deleteById(id: string): Promise<void>;
}

const sessions = new Map<string, Session>();

function nowIso(): string {
  return new Date().toISOString();
}

export const sessionsRepo: SessionsRepo = {
  async create(userId, options) {
    const ttl = options?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    const session: Session = {
      id: `sess_${nanoid(16)}`,
      userId,
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    };
    sessions.set(session.id, session);
    return session;
  },

  async findById(id) {
    const session = sessions.get(id);
    if (!session) return null;
    if (Date.parse(session.expiresAt) <= Date.now()) {
      sessions.delete(id);
      return null;
    }
    return session;
  },

  async deleteById(id) {
    sessions.delete(id);
  },
};

export function __resetSessionsRepo(): void {
  sessions.clear();
}
```

- [ ] **Step 4: Run, confirm 3 passing**

- [ ] **Step 5: Commit**

```powershell
git add src/lib/db/repos/sessions.ts src/lib/db/repos/sessions.test.ts
git commit -m "feat(repos): add mock sessionsRepo with TTL-based expiry"
```

---

## Task 4: otpsRepo (mock, TDD)

**Files:** `src/lib/db/repos/otps.ts`, `src/lib/db/repos/otps.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { __resetOtpsRepo, otpsRepo } from "./otps";

describe("otpsRepo (mock)", () => {
  beforeEach(() => __resetOtpsRepo());

  it("creates an OTP record and finds the active one by email + purpose", async () => {
    const record = await otpsRepo.create({
      email: "a@example.com",
      purpose: "signup",
      code: "123456",
      ttlSeconds: 600,
    });
    expect(record.id).toMatch(/^otp_/);

    const found = await otpsRepo.findActive("a@example.com", "signup");
    expect(found?.id).toBe(record.id);
  });

  it("consumes an OTP and excludes it from active lookups", async () => {
    await otpsRepo.create({
      email: "b@example.com",
      purpose: "signup",
      code: "123456",
      ttlSeconds: 600,
    });
    const active = await otpsRepo.findActive("b@example.com", "signup");
    expect(active).not.toBeNull();
    await otpsRepo.consume(active!.id);
    expect(await otpsRepo.findActive("b@example.com", "signup")).toBeNull();
  });

  it("treats expired OTPs as inactive", async () => {
    await otpsRepo.create({
      email: "c@example.com",
      purpose: "password-reset",
      code: "123456",
      ttlSeconds: -1,
    });
    expect(await otpsRepo.findActive("c@example.com", "password-reset")).toBeNull();
  });
});
```

- [ ] **Step 2: Run, confirm 3 failing**

- [ ] **Step 3: Implement `src/lib/db/repos/otps.ts`**

```ts
import { nanoid } from "nanoid";
import type { OtpPurpose, OtpRecord } from "@/types/domain";

export interface CreateOtpInput {
  email: string;
  purpose: OtpPurpose;
  code: string;
  ttlSeconds: number;
}

export interface OtpsRepo {
  create(input: CreateOtpInput): Promise<OtpRecord>;
  findActive(email: string, purpose: OtpPurpose): Promise<OtpRecord | null>;
  consume(id: string): Promise<void>;
}

const otps = new Map<string, OtpRecord>();

function nowIso(): string {
  return new Date().toISOString();
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const otpsRepo: OtpsRepo = {
  async create(input) {
    const now = Date.now();
    const record: OtpRecord = {
      id: `otp_${nanoid(12)}`,
      email: normaliseEmail(input.email),
      purpose: input.purpose,
      code: input.code,
      expiresAt: new Date(now + input.ttlSeconds * 1000).toISOString(),
      consumedAt: null,
    };
    otps.set(record.id, record);
    return record;
  },

  async findActive(email, purpose) {
    const target = normaliseEmail(email);
    for (const r of [...otps.values()].reverse()) {
      if (r.email !== target) continue;
      if (r.purpose !== purpose) continue;
      if (r.consumedAt !== null) continue;
      if (Date.parse(r.expiresAt) <= Date.now()) continue;
      return r;
    }
    return null;
  },

  async consume(id) {
    const r = otps.get(id);
    if (r) r.consumedAt = nowIso();
  },
};

export function __resetOtpsRepo(): void {
  otps.clear();
}
```

- [ ] **Step 4: Run, confirm 3 passing**

- [ ] **Step 5: Commit**

```powershell
git add src/lib/db/repos/otps.ts src/lib/db/repos/otps.test.ts
git commit -m "feat(repos): add mock otpsRepo with create/findActive/consume"
```

---

## Task 5: Password stub + OTP helpers

**Files:** `src/lib/auth/passwords.ts`, `src/lib/auth/otp.ts`

- [ ] **Step 1: Create `src/lib/auth/passwords.ts`**

```ts
/**
 * STUB hashing for the UI-only phase. NOT secure — real bcrypt
 * (cost 12) lands when the backend phase wires Users to DynamoDB.
 */
const STUB_PREFIX = "stub-hash:";

export async function hashPasswordStub(plain: string): Promise<string> {
  return `${STUB_PREFIX}${plain}`;
}

export async function verifyPasswordStub(plain: string, storedHash: string): Promise<boolean> {
  return storedHash === `${STUB_PREFIX}${plain}`;
}
```

- [ ] **Step 2: Create `src/lib/auth/otp.ts`**

```ts
import type { OtpPurpose } from "@/types/domain";

/**
 * Demo-mode OTP. In a real backend phase this is replaced with
 * cryptographically-random 6-digit codes and SES delivery.
 */
export const DEMO_OTP_CODE = "123456";
export const OTP_TTL_SECONDS = 60 * 10;

export function generateOtpCode(): string {
  return DEMO_OTP_CODE;
}

export function isValidOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function describeOtp(purpose: OtpPurpose): string {
  return purpose === "signup" ? "Email verification" : "Password reset";
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/lib/auth/passwords.ts src/lib/auth/otp.ts
git commit -m "feat(auth): add stub password hashing and demo OTP helpers"
```

---

## Task 6: Session cookie + current-user helpers

**Files:** `src/lib/auth/session-cookie.ts`, `src/lib/auth/current-user.ts`

- [ ] **Step 1: Create `src/lib/auth/session-cookie.ts`**

```ts
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "session_id";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function getSessionCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
```

- [ ] **Step 2: Create `src/lib/auth/current-user.ts`**

```ts
import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";
import type { User } from "@/types/domain";
import { getSessionCookie } from "./session-cookie";

export async function getCurrentUser(): Promise<User | null> {
  const sessionId = await getSessionCookie();
  if (!sessionId) return null;
  const session = await sessionsRepo.findById(sessionId);
  if (!session) return null;
  return usersRepo.findById(session.userId);
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/lib/auth/session-cookie.ts src/lib/auth/current-user.ts
git commit -m "feat(auth): add session-cookie and current-user helpers"
```

---

## Task 7: Extend cartRepo with user cart + merge

**File:** modify `src/lib/db/repos/cart.ts` and `src/lib/db/repos/cart.test.ts`

- [ ] **Step 1: Add failing tests to `cart.test.ts`** (append inside the outer `describe`):

```ts
it("getOrCreateForUser returns the same cart on repeat access", async () => {
  const a = await cartRepo.getOrCreateForUser("usr_a");
  const b = await cartRepo.getOrCreateForUser("usr_a");
  expect(b.id).toBe(a.id);
  expect(a.userId).toBe("usr_a");
});

it("mergeGuestIntoUser merges items keyed by variantSku", async () => {
  await cartRepo.addItem("gs_m1", {
    productId: "p1",
    productSlug: "p1",
    productName: "P1",
    variantSku: "v-red",
    variantLabel: "Red",
    imageUrl: "https://x/y.jpg",
    unitPricePaise: 100000,
    unitMrpPaise: 100000,
    quantity: 2,
  });
  await cartRepo.addItem("gs_m1", {
    productId: "p2",
    productSlug: "p2",
    productName: "P2",
    variantSku: "v-blue",
    variantLabel: "Blue",
    imageUrl: "https://x/y.jpg",
    unitPricePaise: 50000,
    unitMrpPaise: 50000,
    quantity: 1,
  });
  await cartRepo.addItemAsUser("usr_m1", {
    productId: "p1",
    productSlug: "p1",
    productName: "P1",
    variantSku: "v-red",
    variantLabel: "Red",
    imageUrl: "https://x/y.jpg",
    unitPricePaise: 100000,
    unitMrpPaise: 100000,
    quantity: 1,
  });

  const merged = await cartRepo.mergeGuestIntoUser("gs_m1", "usr_m1");
  expect(merged.items).toHaveLength(2);
  const red = merged.items.find((i) => i.variantSku === "v-red");
  const blue = merged.items.find((i) => i.variantSku === "v-blue");
  expect(red?.quantity).toBe(3);
  expect(blue?.quantity).toBe(1);

  // Guest cart cleared
  const guest = await cartRepo.getOrCreateForGuestSession("gs_m1");
  expect(guest.items).toEqual([]);
});
```

- [ ] **Step 2: Run, confirm 2 failing (plus the existing 7 still passing)**

- [ ] **Step 3: Update `src/lib/db/repos/cart.ts`**

Replace the entire file with:

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
  getOrCreateForUser(userId: string): Promise<Cart>;
  addItem(guestSessionId: string, input: AddItemInput): Promise<Cart>;
  addItemAsUser(userId: string, input: AddItemInput): Promise<Cart>;
  updateQuantity(guestSessionId: string, itemId: string, quantity: number): Promise<Cart>;
  removeItem(guestSessionId: string, itemId: string): Promise<Cart>;
  clear(guestSessionId: string): Promise<Cart>;
  mergeGuestIntoUser(guestSessionId: string, userId: string): Promise<Cart>;
}

const cartsByGuest = new Map<string, Cart>();
const cartsByUser = new Map<string, Cart>();

function nowIso(): string {
  return new Date().toISOString();
}

function ensureGuestCart(guestSessionId: string): Cart {
  const existing = cartsByGuest.get(guestSessionId);
  if (existing) return existing;
  const cart: Cart = {
    id: `cart_${nanoid(12)}`,
    userId: null,
    guestSessionId,
    items: [],
    updatedAt: nowIso(),
  };
  cartsByGuest.set(guestSessionId, cart);
  return cart;
}

function ensureUserCart(userId: string): Cart {
  const existing = cartsByUser.get(userId);
  if (existing) return existing;
  const cart: Cart = {
    id: `cart_${nanoid(12)}`,
    userId,
    guestSessionId: null,
    items: [],
    updatedAt: nowIso(),
  };
  cartsByUser.set(userId, cart);
  return cart;
}

function addOrMergeItem(target: Cart, input: AddItemInput): void {
  const existing = target.items.find((i) => i.variantSku === input.variantSku);
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
    target.items.push(item);
  }
  target.updatedAt = nowIso();
}

export const cartRepo: CartRepo = {
  async getOrCreateForGuestSession(guestSessionId) {
    return ensureGuestCart(guestSessionId);
  },

  async getOrCreateForUser(userId) {
    return ensureUserCart(userId);
  },

  async addItem(guestSessionId, input) {
    const cart = ensureGuestCart(guestSessionId);
    addOrMergeItem(cart, input);
    return cart;
  },

  async addItemAsUser(userId, input) {
    const cart = ensureUserCart(userId);
    addOrMergeItem(cart, input);
    return cart;
  },

  async updateQuantity(guestSessionId, itemId, quantity) {
    const cart = ensureGuestCart(guestSessionId);
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
    const cart = ensureGuestCart(guestSessionId);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.updatedAt = nowIso();
    return cart;
  },

  async clear(guestSessionId) {
    const cart = ensureGuestCart(guestSessionId);
    cart.items = [];
    cart.updatedAt = nowIso();
    return cart;
  },

  async mergeGuestIntoUser(guestSessionId, userId) {
    const guest = cartsByGuest.get(guestSessionId);
    const user = ensureUserCart(userId);
    if (guest) {
      for (const item of guest.items) {
        addOrMergeItem(user, {
          productId: item.productId,
          productSlug: item.productSlug,
          productName: item.productName,
          variantSku: item.variantSku,
          variantLabel: item.variantLabel,
          imageUrl: item.imageUrl,
          unitPricePaise: item.unitPricePaise,
          unitMrpPaise: item.unitMrpPaise,
          quantity: item.quantity,
        });
      }
      guest.items = [];
      guest.updatedAt = nowIso();
    }
    return user;
  },
};

export function __resetCartRepo(): void {
  cartsByGuest.clear();
  cartsByUser.clear();
}
```

- [ ] **Step 4: Run all cart tests, confirm 9 passing**

```powershell
npx vitest run src/lib/db/repos/cart.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/lib/db/repos/cart.ts src/lib/db/repos/cart.test.ts
git commit -m "feat(cart): support user carts and guest->user merge"
```

---

## Task 8: Auth server actions (TDD)

**Files:** `src/server/actions/auth.ts`, `src/server/actions/auth.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPasswordStub } from "@/lib/auth/passwords";
import { __resetCartRepo } from "@/lib/db/repos/cart";
import { __resetOtpsRepo, otpsRepo } from "@/lib/db/repos/otps";
import { __resetSessionsRepo } from "@/lib/db/repos/sessions";
import { __resetUsersRepo, usersRepo } from "@/lib/db/repos/users";
import { loginAction, resendOtpAction, signupAction, verifyOtpAction } from "./auth";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const redirectMock = vi.fn((_: string) => {
  throw new Error("NEXT_REDIRECT");
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));

vi.mock("@/lib/auth/session-cookie", () => ({
  SESSION_COOKIE_NAME: "session_id",
  getSessionCookie: vi.fn(async () => null),
  setSessionCookie: vi.fn(async () => {}),
  clearSessionCookie: vi.fn(async () => {}),
}));

vi.mock("@/lib/cart/guest-session", () => ({
  getGuestSessionId: vi.fn(async () => "gs_auth_test"),
  ensureGuestSessionId: vi.fn(async () => "gs_auth_test"),
}));

const clearGuestSessionMock = vi.fn(async () => {});
vi.mock("@/lib/cart/clear-guest-session", () => ({
  clearGuestSessionCookie: clearGuestSessionMock,
}));

describe("auth server actions", () => {
  beforeEach(() => {
    __resetUsersRepo();
    __resetSessionsRepo();
    __resetOtpsRepo();
    __resetCartRepo();
    redirectMock.mockClear();
    clearGuestSessionMock.mockClear();
  });

  it("signupAction creates an unverified user and issues a signup OTP", async () => {
    await expect(
      signupAction({
        fullName: "Aishwarya",
        email: "a@example.com",
        password: "Hunter22!",
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const user = await usersRepo.findByEmail("a@example.com");
    expect(user?.emailVerified).toBe(false);

    const otp = await otpsRepo.findActive("a@example.com", "signup");
    expect(otp?.code).toBe("123456");
    expect(redirectMock).toHaveBeenCalledWith("/auth/verify?email=a%40example.com");
  });

  it("signupAction rejects duplicate emails", async () => {
    await usersRepo.create({
      email: "dup@example.com",
      fullName: "Dup",
      passwordHash: await hashPasswordStub("x"),
    });
    await expect(
      signupAction({ fullName: "X", email: "dup@example.com", password: "abcdefgh" }),
    ).rejects.toThrow(/already/i);
  });

  it("verifyOtpAction marks the user verified and creates a session", async () => {
    await signupAction({
      fullName: "Verify Me",
      email: "v@example.com",
      password: "Hunter22!",
    }).catch(() => {});

    await expect(verifyOtpAction({ email: "v@example.com", code: "123456" })).rejects.toThrow(
      /NEXT_REDIRECT/,
    );

    const verified = await usersRepo.findByEmail("v@example.com");
    expect(verified?.emailVerified).toBe(true);
    expect(redirectMock).toHaveBeenLastCalledWith("/account");
  });

  it("verifyOtpAction rejects wrong codes", async () => {
    await signupAction({
      fullName: "Reject",
      email: "r@example.com",
      password: "Hunter22!",
    }).catch(() => {});

    await expect(verifyOtpAction({ email: "r@example.com", code: "000000" })).rejects.toThrow(
      /incorrect|expired|invalid/i,
    );
  });

  it("resendOtpAction issues a fresh OTP for a known unverified email", async () => {
    await signupAction({
      fullName: "Resend",
      email: "s@example.com",
      password: "Hunter22!",
    }).catch(() => {});
    await resendOtpAction({ email: "s@example.com", purpose: "signup" });
    const otp = await otpsRepo.findActive("s@example.com", "signup");
    expect(otp?.code).toBe("123456");
  });

  it("loginAction authenticates a verified user and creates a session", async () => {
    const user = await usersRepo.create({
      email: "login@example.com",
      fullName: "Login",
      passwordHash: await hashPasswordStub("Hunter22!"),
    });
    await usersRepo.markEmailVerified(user.id);

    await expect(
      loginAction({ email: "login@example.com", password: "Hunter22!" }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenLastCalledWith("/account");
  });

  it("loginAction rejects wrong password", async () => {
    const user = await usersRepo.create({
      email: "wp@example.com",
      fullName: "WP",
      passwordHash: await hashPasswordStub("Right!23"),
    });
    await usersRepo.markEmailVerified(user.id);
    await expect(loginAction({ email: "wp@example.com", password: "Wrong!23" })).rejects.toThrow(
      /incorrect/i,
    );
  });

  it("loginAction routes unverified users to /auth/verify", async () => {
    await usersRepo.create({
      email: "uv@example.com",
      fullName: "UV",
      passwordHash: await hashPasswordStub("Hunter22!"),
    });
    await expect(loginAction({ email: "uv@example.com", password: "Hunter22!" })).rejects.toThrow(
      /NEXT_REDIRECT/,
    );
    expect(redirectMock).toHaveBeenLastCalledWith("/auth/verify?email=uv%40example.com");
  });
});
```

- [ ] **Step 2: Run, confirm failures**

```powershell
npx vitest run src/server/actions/auth.test.ts
```

- [ ] **Step 3: Create the small `clearGuestSessionCookie` helper that the action depends on**

Create `src/lib/cart/clear-guest-session.ts`:

```ts
import { cookies } from "next/headers";

export async function clearGuestSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete("gs_session");
}
```

- [ ] **Step 4: Implement `src/server/actions/auth.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateOtpCode, OTP_TTL_SECONDS } from "@/lib/auth/otp";
import { hashPasswordStub, verifyPasswordStub } from "@/lib/auth/passwords";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session-cookie";
import { clearGuestSessionCookie } from "@/lib/cart/clear-guest-session";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo } from "@/lib/db/repos/cart";
import { otpsRepo } from "@/lib/db/repos/otps";
import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";
import type { OtpPurpose } from "@/types/domain";

export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
}

export async function signupAction(input: SignupInput): Promise<void> {
  const existing = await usersRepo.findByEmail(input.email);
  if (existing) {
    throw new Error("A user with this email already exists.");
  }
  const passwordHash = await hashPasswordStub(input.password);
  await usersRepo.create({
    email: input.email,
    fullName: input.fullName,
    passwordHash,
  });
  await otpsRepo.create({
    email: input.email,
    purpose: "signup",
    code: generateOtpCode(),
    ttlSeconds: OTP_TTL_SECONDS,
  });
  redirect(`/auth/verify?email=${encodeURIComponent(input.email.toLowerCase())}`);
}

export interface VerifyOtpInput {
  email: string;
  code: string;
}

export async function verifyOtpAction(input: VerifyOtpInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (!user) {
    throw new Error("No account found for this email.");
  }
  const active = await otpsRepo.findActive(input.email, "signup");
  if (!active || active.code !== input.code) {
    throw new Error("The code you entered is incorrect or expired.");
  }
  await otpsRepo.consume(active.id);
  await usersRepo.markEmailVerified(user.id);

  await issueSessionAndMergeCart(user.id);
  revalidatePath("/", "layout");
  redirect("/account");
}

export interface ResendOtpInput {
  email: string;
  purpose: OtpPurpose;
}

export async function resendOtpAction(input: ResendOtpInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (!user) return;
  await otpsRepo.create({
    email: input.email,
    purpose: input.purpose,
    code: generateOtpCode(),
    ttlSeconds: OTP_TTL_SECONDS,
  });
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function loginAction(input: LoginInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (!user) {
    throw new Error("Email or password is incorrect.");
  }
  const ok = await verifyPasswordStub(input.password, user.passwordHash);
  if (!ok) {
    throw new Error("Email or password is incorrect.");
  }
  if (!user.emailVerified) {
    await otpsRepo.create({
      email: user.email,
      purpose: "signup",
      code: generateOtpCode(),
      ttlSeconds: OTP_TTL_SECONDS,
    });
    redirect(`/auth/verify?email=${encodeURIComponent(user.email)}`);
  }

  await issueSessionAndMergeCart(user.id);
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/");
}

export interface ForgotPasswordInput {
  email: string;
}

export async function requestPasswordResetAction(input: ForgotPasswordInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (user) {
    await otpsRepo.create({
      email: user.email,
      purpose: "password-reset",
      code: generateOtpCode(),
      ttlSeconds: OTP_TTL_SECONDS,
    });
  }
  redirect(`/auth/reset-password?email=${encodeURIComponent(input.email.toLowerCase())}`);
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  password: string;
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (!user) {
    throw new Error("No account found for this email.");
  }
  const active = await otpsRepo.findActive(input.email, "password-reset");
  if (!active || active.code !== input.code) {
    throw new Error("The code you entered is incorrect or expired.");
  }
  await otpsRepo.consume(active.id);
  const hash = await hashPasswordStub(input.password);
  await usersRepo.updatePasswordHash(user.id, hash);
  await issueSessionAndMergeCart(user.id);
  revalidatePath("/", "layout");
  redirect("/account");
}

async function issueSessionAndMergeCart(userId: string): Promise<void> {
  const session = await sessionsRepo.create(userId);
  await setSessionCookie(session.id);
  const guestSessionId = await getGuestSessionId();
  if (guestSessionId) {
    await cartRepo.mergeGuestIntoUser(guestSessionId, userId);
    await clearGuestSessionCookie();
  } else {
    await cartRepo.getOrCreateForUser(userId);
  }
}
```

- [ ] **Step 5: Run tests, confirm all auth tests pass**

```powershell
npx vitest run src/server/actions/auth.test.ts
```

- [ ] **Step 6: Commit**

```powershell
git add src/server/actions/auth.ts src/server/actions/auth.test.ts src/lib/cart/clear-guest-session.ts
git commit -m "feat(actions): add auth server actions (signup/verify/login/logout/reset)"
```

---

## Task 9: Middleware for /account/\* protection

**File:** `src/middleware.ts`

- [ ] **Step 1: Create the file**

```ts
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "session_id";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"],
};
```

> Note: the middleware only checks for cookie _presence_. It does not validate the session against the sessions repo (Edge runtime cannot import the Node-only `nanoid`/`Map` repo without bundler tweaks). Server Components and Server Actions still call `getCurrentUser()` for the real check. This is intentional for the UI-only phase; the real version moves to a token-based scheme in a later phase.

- [ ] **Step 2: Build verify**

```powershell
npx next build
```

- [ ] **Step 3: Commit**

```powershell
git add src/middleware.ts
git commit -m "feat(auth): add middleware gating /account/* on session cookie presence"
```

---

## Task 10: PasswordInput + OtpInput primitives (OtpInput TDD)

**Files:** `src/components/ui/PasswordInput.tsx`, `src/components/ui/OtpInput.tsx`, `src/components/ui/OtpInput.test.tsx`

- [ ] **Step 1: Create `PasswordInput.tsx`**

```tsx
"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface PasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  invalid?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, invalid, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          aria-invalid={invalid ? "true" : undefined}
          className={clsx(
            "h-11 w-full rounded-sm border bg-bg-elevated px-3 pr-11 text-base text-ink-900 transition placeholder:text-ink-500",
            "focus:border-accent-primary focus:outline-none",
            invalid ? "border-danger focus:border-danger" : "border-ink-500/30",
            className,
          )}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-ink-500 transition hover:text-ink-900"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
```

- [ ] **Step 2: Failing test for OtpInput**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OtpInput } from "./OtpInput";

describe("OtpInput", () => {
  it("renders 6 single-digit inputs", () => {
    render(<OtpInput value="" onChange={() => {}} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("forwards typed digits to onChange", async () => {
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0]!, "1");
    expect(onChange).toHaveBeenLastCalledWith("1");
  });
});
```

- [ ] **Step 3: Run, confirm 2 failing**

- [ ] **Step 4: Implement `OtpInput.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useRef } from "react";
import { clsx } from "@/lib/utils/clsx";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  invalid?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  invalid,
  autoFocus = true,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setRef = useCallback(
    (idx: number) => (el: HTMLInputElement | null) => {
      refs.current[idx] = el;
    },
    [],
  );

  function handleChange(idx: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = value.split("");
    while (next.length < length) next.push("");
    next[idx] = digit;
    const trimmed = next.slice(0, length).join("").replace(/\s+$/, "");
    onChange(trimmed);
    if (digit && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className="flex gap-2">
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={setRef(idx)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] ?? ""}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          aria-invalid={invalid ? "true" : undefined}
          aria-label={`Digit ${idx + 1}`}
          className={clsx(
            "h-12 w-12 rounded-sm border text-center text-xl font-semibold tabular-nums transition",
            "focus:border-accent-primary focus:outline-none",
            invalid ? "border-danger" : "border-ink-500/30",
          )}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run, confirm 2 passing**

- [ ] **Step 6: Commit**

```powershell
git add src/components/ui/PasswordInput.tsx src/components/ui/OtpInput.tsx src/components/ui/OtpInput.test.tsx
git commit -m "feat(ui): add PasswordInput and OtpInput primitives"
```

---

## Task 11: AuthCard + DemoNotice shells

**Files:** `src/components/auth/AuthCard.tsx`, `src/components/auth/DemoNotice.tsx`

- [ ] **Step 1: Create `AuthCard.tsx`**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

export interface AuthCardProps {
  title: string;
  description?: string;
  footerPrompt?: string;
  footerHref?: string;
  footerLabel?: string;
  children: ReactNode;
}

export function AuthCard({
  title,
  description,
  footerPrompt,
  footerHref,
  footerLabel,
  children,
}: AuthCardProps) {
  return (
    <Container size="sm" className="py-16">
      <div className="mx-auto max-w-md">
        <div className="flex flex-col gap-2 pb-8">
          <Link href="/" className="font-display text-3xl text-ink-900">
            Saree Store
          </Link>
          <h1 className="font-display text-2xl text-ink-900">{title}</h1>
          {description && <p className="text-sm text-ink-700">{description}</p>}
        </div>
        <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-6 md:p-8">
          {children}
        </div>
        {footerPrompt && footerHref && footerLabel && (
          <p className="mt-6 text-center text-sm text-ink-700">
            {footerPrompt}{" "}
            <Link href={footerHref} className="font-medium text-accent-primary hover:underline">
              {footerLabel}
            </Link>
          </p>
        )}
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Create `DemoNotice.tsx`**

```tsx
import { Sparkles } from "lucide-react";

export function DemoNotice() {
  return (
    <div className="mb-6 flex items-start gap-2 rounded-sm border border-accent-gold/40 bg-accent-gold/10 p-3 text-xs text-ink-700">
      <Sparkles aria-hidden className="mt-0.5 h-4 w-4 text-accent-gold" />
      <span>
        Demo mode: the verification code is{" "}
        <span className="font-semibold text-ink-900">123456</span>. Real email delivery and bcrypt
        password hashing wire up in a later phase.
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/auth/AuthCard.tsx src/components/auth/DemoNotice.tsx
git commit -m "feat(auth): add AuthCard shell and DemoNotice banner"
```

---

## Task 12: SignupForm + LoginForm

**Files:** `src/components/auth/SignupForm.tsx`, `src/components/auth/LoginForm.tsx`

- [ ] **Step 1: Create `SignupForm.tsx`**

```tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { signupAction } from "@/server/actions/auth";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

type Values = z.infer<typeof schema>;

export function SignupForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        await signupAction(values);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        const message =
          err instanceof Error ? err.message : "Couldn't create your account. Please try again.";
        toast.error(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="name"
          {...register("fullName")}
          invalid={!!errors.fullName}
        />
      </FormField>
      <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          invalid={!!errors.email}
        />
      </FormField>
      <FormField
        label="Password"
        htmlFor="password"
        required
        hint="At least 8 characters"
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          {...register("password")}
          invalid={!!errors.password}
        />
      </FormField>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create `LoginForm.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { loginAction } from "@/server/actions/auth";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

type Values = z.infer<typeof schema>;

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        await loginAction(values);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        const message =
          err instanceof Error ? err.message : "Couldn't sign you in. Please try again.";
        toast.error(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          invalid={!!errors.email}
        />
      </FormField>
      <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          {...register("password")}
          invalid={!!errors.password}
        />
      </FormField>
      <div className="-mt-2 text-right">
        <Link href="/auth/forgot-password" className="text-xs text-ink-500 hover:text-ink-900">
          Forgot password?
        </Link>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/auth/SignupForm.tsx src/components/auth/LoginForm.tsx
git commit -m "feat(auth): add SignupForm and LoginForm"
```

---

## Task 13: OtpForm + reset forms

**Files:** `src/components/auth/OtpForm.tsx`, `src/components/auth/PasswordResetRequestForm.tsx`, `src/components/auth/PasswordResetForm.tsx`

- [ ] **Step 1: Create `OtpForm.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resendOtpAction, verifyOtpAction } from "@/server/actions/auth";
import { OtpInput } from "@/components/ui/OtpInput";

export interface OtpFormProps {
  email: string;
}

export function OtpForm({ email }: OtpFormProps) {
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();
  const [resending, startResending] = useTransition();

  function submit() {
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    startTransition(async () => {
      try {
        await verifyOtpAction({ email, code });
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        const message = err instanceof Error ? err.message : "Verification failed.";
        toast.error(message);
      }
    });
  }

  function resend() {
    startResending(async () => {
      try {
        await resendOtpAction({ email, purpose: "signup" });
        toast.success("A new code has been generated. (Demo mode: it's still 123456.)");
      } catch {
        toast.error("Couldn't resend the code.");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-5"
    >
      <p className="text-sm text-ink-700">
        We sent a 6-digit code to <span className="font-medium text-ink-900">{email}</span>.
      </p>
      <OtpInput value={code} onChange={setCode} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Verify and continue"}
      </button>
      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="text-sm text-ink-500 underline-offset-4 transition hover:text-ink-900 hover:underline"
      >
        {resending ? "Sending a new code…" : "Resend code"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create `PasswordResetRequestForm.tsx`**

```tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { requestPasswordResetAction } from "@/server/actions/auth";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

const schema = z.object({ email: z.email("Enter a valid email") });
type Values = z.infer<typeof schema>;

export function PasswordResetRequestForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        await requestPasswordResetAction(values);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error("Couldn't send the reset code.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          invalid={!!errors.email}
        />
      </FormField>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send reset code"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create `PasswordResetForm.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { resetPasswordAction } from "@/server/actions/auth";
import { FormField } from "@/components/ui/FormField";
import { OtpInput } from "@/components/ui/OtpInput";
import { PasswordInput } from "@/components/ui/PasswordInput";

const schema = z.object({
  password: z.string().min(8, "Use at least 8 characters"),
});
type Values = z.infer<typeof schema>;

export function PasswordResetForm({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    startTransition(async () => {
      try {
        await resetPasswordAction({ email, code, password: values.password });
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Reset failed.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <p className="text-sm text-ink-700">
        Enter the code sent to <span className="font-medium text-ink-900">{email}</span> and choose
        a new password.
      </p>
      <FormField label="Verification code" htmlFor="otp" required>
        <OtpInput value={code} onChange={setCode} />
      </FormField>
      <FormField label="New password" htmlFor="password" required error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          {...register("password")}
          invalid={!!errors.password}
        />
      </FormField>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Commit**

```powershell
git add src/components/auth/OtpForm.tsx src/components/auth/PasswordResetRequestForm.tsx src/components/auth/PasswordResetForm.tsx
git commit -m "feat(auth): add OtpForm and password-reset forms"
```

---

## Task 14: Auth pages

**Files:**

- `src/app/(storefront)/auth/signup/page.tsx`
- `src/app/(storefront)/auth/verify/page.tsx`
- `src/app/(storefront)/auth/login/page.tsx`
- `src/app/(storefront)/auth/forgot-password/page.tsx`
- `src/app/(storefront)/auth/reset-password/page.tsx`

- [ ] **Step 1: Create `auth/signup/page.tsx`**

```tsx
import { AuthCard } from "@/components/auth/AuthCard";
import { DemoNotice } from "@/components/auth/DemoNotice";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Create account · Saree Store" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Save your wishlist, track your orders, and check out faster."
      footerPrompt="Already have an account?"
      footerHref="/auth/login"
      footerLabel="Sign in"
    >
      <DemoNotice />
      <SignupForm />
    </AuthCard>
  );
}
```

- [ ] **Step 2: Create `auth/verify/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { DemoNotice } from "@/components/auth/DemoNotice";
import { OtpForm } from "@/components/auth/OtpForm";

export const metadata = { title: "Verify your email · Saree Store" };

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  if (!email) redirect("/auth/signup");
  return (
    <AuthCard title="Verify your email" description="Enter the 6-digit code we just sent you.">
      <DemoNotice />
      <OtpForm email={email} />
    </AuthCard>
  );
}
```

- [ ] **Step 3: Create `auth/login/page.tsx`**

```tsx
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in · Saree Store" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your Saree Store account."
      footerPrompt="New here?"
      footerHref="/auth/signup"
      footerLabel="Create an account"
    >
      <LoginForm />
    </AuthCard>
  );
}
```

- [ ] **Step 4: Create `auth/forgot-password/page.tsx`**

```tsx
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";

export const metadata = { title: "Reset password · Saree Store" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send a 6-digit code."
      footerPrompt="Remembered it?"
      footerHref="/auth/login"
      footerLabel="Back to sign in"
    >
      <PasswordResetRequestForm />
    </AuthCard>
  );
}
```

- [ ] **Step 5: Create `auth/reset-password/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { DemoNotice } from "@/components/auth/DemoNotice";
import { PasswordResetForm } from "@/components/auth/PasswordResetForm";

export const metadata = { title: "Set a new password · Saree Store" };

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  if (!email) redirect("/auth/forgot-password");
  return (
    <AuthCard title="Choose a new password">
      <DemoNotice />
      <PasswordResetForm email={email} />
    </AuthCard>
  );
}
```

- [ ] **Step 6: Build verify**

```powershell
npx next build
```

Expected: all 5 auth pages registered.

- [ ] **Step 7: Commit**

```powershell
git add "src/app/(storefront)/auth"
git commit -m "feat(auth): add signup, verify, login, forgot-password, reset-password pages"
```

---

## Task 15: /account placeholder dashboard

**File:** `src/app/(storefront)/account/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logoutAction } from "@/server/actions/auth";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Account · Saree Store" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account");

  return (
    <Container size="lg" className="py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Account" }]} />
      <header className="mt-6 flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">Welcome back</span>
        <h1 className="font-display text-3xl text-ink-900 md:text-5xl">{user.fullName}</h1>
        <p className="text-ink-700">{user.email}</p>
      </header>
      <section className="mt-10 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="mb-3 font-display text-2xl text-ink-900">Your account</h2>
        <p className="text-sm text-ink-700">
          Orders, addresses, profile editing, and the wishlist land in the next phase. For now, you
          can browse the shop and your cart will follow you on sign-in.
        </p>
        <form action={logoutAction} className="mt-6">
          <button
            type="submit"
            className="rounded-sm border border-ink-500/30 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-900 hover:text-ink-900"
          >
            Sign out
          </button>
        </form>
      </section>
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
git add "src/app/(storefront)/account/page.tsx"
git commit -m "feat(account): add /account placeholder dashboard with logout"
```

---

## Task 16: Make Header auth-aware

**File:** modify `src/components/shared/Header.tsx`

The Header currently renders a generic Account `IconButton`. Replace it with either a link to `/auth/login` (when logged out) or a link to `/account` (when logged in). Also: if logged in, read the user's cart instead of the guest cart.

- [ ] **Step 1: Replace the file**

```tsx
import Link from "next/link";
import { Heart, Menu, Search, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { computeSubtotalPaise } from "@/lib/cart/totals";
import { cartRepo } from "@/lib/db/repos/cart";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { CartTrigger } from "@/components/storefront/CartTrigger";
import { Container } from "@/components/ui/Container";
import { IconButton } from "@/components/ui/IconButton";
import type { Cart } from "@/types/domain";

async function readCart(): Promise<Cart> {
  const user = await getCurrentUser();
  if (user) {
    return cartRepo.getOrCreateForUser(user.id);
  }
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
  const [categories, user, cart] = await Promise.all([
    categoriesRepo.listTopLevel(),
    getCurrentUser(),
    readCart(),
  ]);
  const subtotalPaise = computeSubtotalPaise(cart.items);
  const accountHref = user ? "/account" : "/auth/login";
  const accountLabel = user ? "Account" : "Sign in";

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
            <Link
              href={accountHref}
              aria-label={accountLabel}
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-700 transition hover:bg-ink-900/5 hover:text-ink-900"
            >
              <User className="h-5 w-5" />
            </Link>
            <CartTrigger cart={cart} subtotalPaise={subtotalPaise} />
          </div>
        </div>
      </Container>
    </header>
  );
}
```

- [ ] **Step 2: Build verify**

```powershell
npx next build
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/shared/Header.tsx
git commit -m "feat(shared): Header is auth-aware, uses user cart when signed in"
```

---

## Task 17: E2E auth flow

**File:** `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Create the file**

```ts
import { expect, test } from "@playwright/test";

test.describe("Auth flow", () => {
  test("sign up, verify OTP, land on account page", async ({ page }) => {
    const email = `test+${Date.now()}@example.com`;

    await page.goto("/auth/signup");
    await page.getByLabel(/Full name/i).fill("Test User");
    await page.getByLabel(/^Email/i).fill(email);
    await page.getByLabel(/^Password/i).fill("Hunter22!");
    await page.getByRole("button", { name: /Create account/i }).click();

    await expect(page).toHaveURL(/\/auth\/verify\?email=/);

    // Demo OTP is 123456 — fill across the 6 inputs
    const digits = page.getByLabel(/^Digit \d$/);
    for (let i = 0; i < 6; i++) {
      await digits.nth(i).fill("123456"[i]!);
    }

    await page.getByRole("button", { name: /Verify and continue/i }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("heading", { level: 1, name: /Test User/ })).toBeVisible();
  });

  test("middleware redirects unauthenticated /account access to /auth/login", async ({ page }) => {
    const res = await page.goto("/account");
    await expect(page).toHaveURL(/\/auth\/login/);
    expect(res?.status()).toBeLessThan(400);
  });

  test("login rejects wrong password", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel(/^Email/i).fill("nobody@example.com");
    await page.getByLabel(/^Password/i).fill("wrong-password");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText(/incorrect/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run e2e**

```powershell
npm run e2e
```

Expected: existing 16 + 3 new tests, all passing.

If a test fails because:

- Multiple `Sign in` text matches (footer prompt + button) — narrow the button selector with `getByRole("button", { name: /Sign in/i })` which we already do.
- The OTP input does not have `aria-label="Digit 1"` etc. — refer to the OtpInput primitive; it does set those labels.

- [ ] **Step 3: Commit**

```powershell
git add tests/e2e/auth.spec.ts
git commit -m "test(e2e): add auth flow (signup + verify + middleware + bad login)"
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
git tag -a phase-4-complete -m "Phase 4 (auth UI) complete"
```

---

## What's NOT in this phase

- Real bcrypt password hashing → backend phase. `passwords.ts` is a stub.
- Real JWT / refresh-token rotation → backend phase. Session is a single random cookie keyed at the sessionsRepo.
- Real OTP delivery via SES → email phase. OTP is always `123456`.
- Rate limits on auth endpoints → backend phase.
- Google OAuth → deferred (user picked email/password only in brainstorm).
- Account dashboard subpages (orders, addresses, profile editing, wishlist) → Phase 5 (Account UI).
- Admin auth (`role: "admin"`) gating → Phase 6 (Admin UI).

## Spec coverage (§6)

- Signup with email + password + OTP verification ✓
- Login with verified/unverified branching ✓
- Password reset via OTP ✓
- Logout ✓
- Session cookie + middleware-gated `/account/*` ✓
- Guest → user cart merge on login ✓
- Admin/staff roles — schema in place via `UserRole`; the gating UI lands in Phase 6.
- Rate limits + CSRF + real crypto + real email → deferred (documented above).
