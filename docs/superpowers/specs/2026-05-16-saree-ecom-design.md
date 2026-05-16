# Saree E-Commerce App — Design Spec

**Date:** 2026-05-16
**Status:** Approved (pending file review)
**Reference:** https://www.shreedevitextile.com/

## 1. Overview

A full-featured e-commerce web app for selling sarees and related ethnic wear. Customer-facing storefront with browsing, cart, checkout, and account management; admin panel for products, orders, customers, coupons, banners, and content. Online payments via Razorpay, COD fallback, shipping via Shiprocket, transactional emails via Nodemailer + AWS SES.

The design prioritises:
- **Premium, editorial UI** (not Amazon-style density).
- **Mobile-first responsive** with measured performance budgets.
- **Server-side cart** (no localStorage) so it survives device changes and remains the source of truth.
- **Server-side price recomputation** — clients never set totals.
- **Idempotent webhooks** for both payment and shipping.

## 2. Decisions (Locked)

| Area | Decision |
|---|---|
| Frontend framework | Next.js 16.2 (App Router, RSC, Server Actions, React Compiler enabled) |
| Styling | Tailwind CSS v4 + MUI v6 (themes bridged via CSS variables) |
| UI extras | Framer Motion, Embla Carousel, React Hook Form + Zod, TanStack Query v5, Lucide React, next/image |
| Database | AWS DynamoDB (multi-table) |
| Storage | AWS S3 + CloudFront for product imagery; signed-URL uploads |
| Email | Nodemailer over AWS SES SMTP, React Email templates |
| Payments | Razorpay (UPI / card / netbanking / wallet) + Cash on Delivery |
| Shipping | Shiprocket aggregator API |
| Auth | Email + password + email OTP verification; httpOnly JWT cookies + server-side refresh sessions |
| Hosting | Vercel (web) + AWS (data, storage, email) |
| Admin | In-app `/admin/*` with RBAC (admin / staff), audit log |
| Guest cart | Allowed; persisted in DB keyed by signed cookie; merged on login |
| Variants | Color (required) + optional size + free-text blouse note; stock tracked per variant |

## 3. Architecture

**Approach A — Monolithic Next.js with RSC + Server Actions.**

- One Next.js app, two route groups: `(storefront)` and `(admin)`.
- Reads in Server Components, hitting DynamoDB directly via the SDK.
- Mutations as Server Actions for in-app flows (auth, cart, checkout, admin CRUD).
- REST `/api/*` routes reserved for external callers: Razorpay and Shiprocket webhooks, S3 presign endpoint, any `/api/admin/*` endpoints that benefit from TanStack Query on the client (data grids, polling).
- Middleware (`src/middleware.ts`) gates `/admin/*`, `/account/*`, `/checkout/*` and enforces RBAC.

Alternatives considered and rejected: a thick REST layer (extra hops, fights Next 16 idioms) and split storefront + admin apps (3× ops cost for a single-seller shop).

## 4. Folder Structure

```
src/
├── app/
│   ├── (storefront)/
│   │   ├── page.tsx                    # Home
│   │   ├── shop/[[...slug]]/page.tsx   # Category + filters
│   │   ├── product/[slug]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── account/(dashboard)/
│   │   ├── auth/(login|signup|verify|forgot-password)/
│   │   ├── (static)/(about|contact|policies)/
│   │   └── blog/...
│   ├── (admin)/admin/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── coupons/
│   │   ├── banners/
│   │   ├── content/
│   │   └── settings/
│   ├── api/
│   │   ├── webhooks/razorpay/route.ts
│   │   ├── webhooks/shiprocket/route.ts
│   │   ├── admin/                      # TanStack-Query-friendly endpoints
│   │   └── uploads/presign/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/         # Primitive design-system components
│   ├── storefront/
│   ├── admin/
│   └── shared/
├── lib/
│   ├── db/         # DynamoDB client + per-entity accessors
│   ├── auth/       # JWT, password, sessions, middleware helpers
│   ├── payments/razorpay.ts
│   ├── shipping/shiprocket.ts
│   ├── mail/       # Nodemailer + React Email templates
│   ├── storage/s3.ts
│   ├── validation/ # Zod schemas (shared client + server)
│   └── utils/
├── server/
│   ├── actions/    # Server Actions grouped by domain
│   └── services/   # Business logic (orders, cart, inventory)
├── types/
├── styles/
└── middleware.ts
```

## 5. Data Model (DynamoDB)

Multi-table design. Money stored as **integer paise**. IDs are entity-prefixed nanoid(12): `prd_xxxx`, `ord_xxxx`, `usr_xxxx`, etc.

| Table | PK | SK | GSIs | Notes |
|---|---|---|---|---|
| Users | userId | — | EmailIndex (email) | role: `customer` \| `staff` \| `admin`; passwordHash (bcrypt cost 12); emailVerified |
| OtpCodes | email | `purpose#otpId` | — | TTL attribute; purpose: `signup` \| `password-reset` |
| Sessions | sessionId | — | UserIndex (userId) | Server-side refresh sessions; TTL; revocable |
| Categories | categoryId | — | SlugIndex (slug) | Tree via parentId; sort order |
| Products | productId | — | SlugIndex (slug); CategoryStatusIndex (categoryId, status#createdAt) | Variants nested; price; mrp (in paise); images[]; status: `draft` \| `active` \| `archived` |
| Inventory | productId | variantSku | — | stock; reserved; atomic conditional decrements |
| Carts | cartId | — | UserIndex (userId); SessionIndex (guestSessionId) | TTL 30d for guests; items[] denormalize price at add-time |
| Addresses | userId | addressId | — | One default flag |
| Orders | orderId | — | UserCreatedIndex (userId, createdAt); StatusCreatedIndex (status, createdAt) | Snapshot of items/prices/address at order time; payment + shipment substructs; status timeline |
| Coupons | code | — | StatusIndex (status, validTo) | type: `percent` \| `flat`; constraints; usage count |
| Banners | bannerId | — | PlacementIndex (placement, order) | Hero, category strip, etc. |
| Reviews | productId | reviewId | UserIndex (userId, createdAt) | Verified-purchase gated; moderation flag |
| BlogPosts | postId | — | SlugIndex (slug); StatusPublishedIndex (status, publishedAt) | Tiptap-authored content |
| WebhookEvents | provider#eventId | — | — | Idempotency keys (Razorpay, Shiprocket); TTL 30d |
| AdminAuditLog | logId | — | ActorIndex (actorId, createdAt) | Who/what/when, before/after diff |
| Settings | scope | key | — | scope: `store` \| `payments` \| `shipping` \| `cache`; values JSON-encoded; provider keys encrypted at rest (KMS via SDK) |
| RateLimits | bucketKey | — | — | bucketKey e.g. `otp:email@x.com`, `login:1.2.3.4`; counter + window; TTL |

Point-in-time recovery enabled on all tables before launch.

## 6. Authentication

- **Signup:** email + password + name. Server validates with Zod, checks EmailIndex, hashes password (bcrypt cost 12), creates user with `emailVerified=false`, generates a 6-digit OTP stored in OtpCodes with 10-min TTL, sends OTP via Nodemailer.
- **Verify:** user submits OTP → constant-time compare → set `emailVerified=true` → delete OTP → issue session.
- **Login:** if `emailVerified=false`, redirect to verify. On success, issue an access JWT (15 min, HS256, httpOnly + Secure + SameSite=Lax) and create a Sessions row (30 d) whose id is stored in a second httpOnly cookie. Middleware refreshes the access JWT silently using the session row.
- **Password reset:** OTP → submit OTP + new password → revoke all sessions → force re-login.
- **Admin/staff:** same Users table; `role` is the gate. First admin bootstrapped by `scripts/bootstrap-admin.ts` using env vars.
- **Rate limits:** OTP requests ≤ 1 per 60s per email and ≤ 5 per hour per email; login ≤ 10 per 10 min per IP. Counters persisted in the `RateLimits` table with TTL.
- **CSRF:** SameSite=Lax + Next 16's built-in Server Action protection; double-submit token on `/api/*` POSTs from the browser.

## 7. Cart

- Logged-in cart keyed via `Carts.UserIndex` on userId.
- Guest cart keyed via `Carts.SessionIndex` on a signed httpOnly `guest_session` cookie (`gs_<nanoid>`) set on first visit.
- **Merge on login:** sum quantities, dedupe by `productId+variantSku`, prefer the user cart's existing line if both exist; delete guest cart; clear cookie.
- Mutations are Server Actions: `addToCart`, `updateQty`, `removeItem`, `clearCart`.
- **Server-side price recomputation** on every cart render. Line denormalised price exists only as an at-add reference for "price changed since you added" UX hints.
- Guest carts auto-expire after 30 d (DynamoDB TTL).

## 8. Checkout

Single-page, three collapsing steps with progress indicator: Address → Shipping → Payment, with a sticky order summary on the right (desktop) / bottom sheet (mobile).

1. **Address:** select saved or add new (RHF + Zod). Pincode validated against Shiprocket serviceability.
2. **Shipping:** call Shiprocket `courier/serviceability` → show couriers + rates → user picks.
3. **Payment:** Razorpay or COD (COD only enabled if pincode is COD-serviceable).
4. **Place order:**
   - Create Order: status `pending_payment` (Razorpay) or `confirmed` (COD). Snapshot items, prices, address, shipping option, coupon, taxes (GST 5% on sarees).
   - For Razorpay: create Razorpay Order ID, return to client.
   - **Inventory reservation:** atomic per-variant `UpdateItem` with `ConditionExpression: reserved + qty <= stock`. On failure, return 409 with offending item; do not create order.

## 9. Payments

### 9.1 Razorpay

1. Client opens Razorpay Checkout modal with the returned order ID.
2. On success, browser receives `razorpay_payment_id` and `razorpay_signature`.
3. Server Action `/payments/verify` recomputes HMAC-SHA256 of `razorpay_order_id|razorpay_payment_id` with the key secret and compares.
4. **Webhook `/api/webhooks/razorpay` is the source of truth.** Verifies webhook signature against `RAZORPAY_WEBHOOK_SECRET`. Handles `payment.captured`, `payment.failed`, `order.paid`. Dedupes via `WebhookEvents` table on the Razorpay event ID.
5. On confirmed payment → mark order `paid` → kick off Shiprocket order creation → enqueue confirmation email.
6. On failure or 15-minute timeout → release reserved inventory, mark order `payment_failed`.

### 9.2 COD

- Order goes directly to `confirmed`, inventory stays reserved, confirmation email sent.
- Admin can configure an optional COD fee (default off) in Settings.
- Shipment can be created automatically on confirmation or manually from the admin order page (admin-toggleable).

### 9.3 Refunds

- Admin triggers from order detail. Online refunds via `payments/{id}/refund` Razorpay API. COD refunds tracked as manual with a note. Status visible in customer order detail.

## 10. Shipping (Shiprocket)

- **Auth:** API token refreshed on demand; cached in a Settings entry; refresh runs lazily on first call past 9-day mark (token expires at 10 days).
- **Serviceability check** at pincode entry on checkout.
- **Create shipment** on order confirmation → POST `/orders/create/adhoc`; store `shipmentId`, AWB, courier name, label URL on the Order.
- **Label + manifest** generated on admin trigger; PDFs stored in S3, signed URL returned to admin.
- **Tracking webhook** `/api/webhooks/shiprocket` updates the order's shipment status timeline (`in_transit`, `out_for_delivery`, `delivered`, `rto`). Auth via shared secret + IP allowlist; dedupe via WebhookEvents.
- **Returns / RTO:** admin marks return initiated; refund triggered through Razorpay for online orders.

## 11. Emails (Nodemailer)

- **Transport:** Nodemailer over AWS SES SMTP, wrapped in `lib/mail/send.ts`.
- **Templates:** React Email components rendered to HTML server-side; plain-text alternative auto-generated.
- **Triggers:** signup OTP, password-reset OTP, order confirmed, order shipped, order delivered, order cancelled / refund initiated, new-order admin notification, daily low-stock digest (variants with stock ≤ 3).
- **Delivery:** fire-and-forget via Next 16 `after()` so checkout response is not blocked by SES latency. Three retries with exponential backoff. Persistent failures alert admin.

## 12. Admin Panel

- **Layout:** collapsible left sidebar + top bar (global search, profile, notifications) + content area; MUI DataGrid for tables.
- **Dashboard:** KPI cards (today's revenue, orders today, pending shipments, low-stock count), 7- and 30-day revenue chart (Recharts), recent orders feed.
- **Products:** list with filter/bulk actions; add/edit form with name, slug auto, MRP, sale price, Tiptap description, category multi-select, tags, variant matrix (color × optional size with per-variant SKU/stock/image), drag-drop gallery (S3 presigned), SEO fields, status.
- **Orders:** list + detail (customer, address, items, payments, shipment timeline) with actions (mark packed, create shipment, generate label, cancel, refund, add internal note).
- **Customers:** list + detail (profile, addresses, order history, lifetime spend); block/unblock; resend verification.
- **Coupons:** CRUD (code, type, min order, max discount, usage cap, valid window, product/category scope).
- **Banners:** CRUD with placement, image, link, sort order, active toggle; live preview.
- **Content:** blog posts and static pages (about, contact, shipping policy, refund policy, terms, privacy) with Tiptap.
- **Settings:** store profile, GST number, COD fee toggle, masked Razorpay & Shiprocket keys (encrypted at rest), email-template preview, admin user invites.
- **RBAC:** `admin` full; `staff` no settings, no key view, no admin invites, no customer block.
- **Audit log:** every mutating admin action persists actor, action, target, before/after diff for critical fields.

## 13. UI Design System

### 13.1 Brand Direction
Editorial, elegant, "boutique" feel — closer to premium ethnic-wear brands than the dense reference site.

### 13.2 Tokens (Tailwind v4 `@theme` + CSS variables, mirrored to MUI theme)

```
Colors:
  --ink-900 deep maroon-near-black (titles)
  --ink-700 body
  --ink-500 muted
  --bg-base warm ivory (#FAF7F2)
  --bg-elevated white
  --accent-primary deep crimson (#8E2A2A)
  --accent-gold antique gold (#B8893E)
  --success / --warning / --danger semantic
Type:
  Display: Cormorant Garamond (serif)
  Body:    Inter
  Tabular numerals for prices
Scale: 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64
Radius: 4 / 12 / 24
Spacing: 4-pt grid
Motion: 180 ms ease-out default; hover 1.02 scale + lift
```

### 13.3 Component Library (`components/ui/`)

Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Badge, Chip, Toast, Sheet, Modal, Tabs, Accordion, Breadcrumb, Pagination, Skeleton, EmptyState, RatingStars, PriceTag (MRP strike + discount %), VariantPicker, QuantityStepper, ProductCard, CategoryCard, BannerHero, ProductGallery (Embla), FilterDrawer, Sort, AddToCartButton, CartLine, AddressCard, OrderStatusTimeline.

### 13.4 Page Highlights

- **Home:** full-bleed hero with parallax saree imagery + editorial headline + CTA; curated collections as horizontal rails; "Shop by Fabric" tile grid; founder/craft storyteller; reviews carousel; Instagram strip.
- **Shop:** sticky filter rail (desktop) / bottom-sheet (mobile); filters by category, fabric, color (swatches), occasion, price range, in-stock; grid 2 / 3 / 4 across mobile / tablet / desktop; hover swaps to second image; quick-view modal.
- **Product:** large gallery with hover zoom + Embla thumbnails; name + price (MRP strike) + variant swatches + blouse note + quantity + Add to Cart + Buy Now + delivery-pincode-check; tabs (description, fabric/care, reviews); "You may also like".
- **Cart:** two-column on desktop with sticky summary; mobile collapses summary to bottom sheet.
- **Checkout:** three-step accordion + sticky summary.
- **Account:** sidebar nav + sections (orders with inline timeline, addresses, profile, wishlist).

### 13.5 Responsive & Accessibility

- Mobile-first; tested on 360 / 414 / 768 / 1024 / 1280 / 1536.
- Touch targets ≥ 44 px.
- Semantic HTML, visible focus rings, prefers-reduced-motion respected, AA contrast minimum, keyboard-complete checkout, ARIA on custom components.
- Images: AVIF/WebP via next/image with blurDataURL placeholders.

### 13.6 SEO

- Per-product metadata (title, description, OG image), JSON-LD `Product` + `Offer` + `AggregateRating`.
- Category JSON-LD `ItemList`; breadcrumb schema; canonical URLs.
- `sitemap.xml` + `robots.txt` generated from active products and published content.

### 13.7 Performance Budget

LCP ≤ 2.0 s, CLS ≤ 0.05, TBT ≤ 200 ms on a simulated 4G connection. RSC + streaming + priority image on hero.

## 14. Phased Build Order

Each phase is a reviewable deliverable. Estimates assume one full-time developer.

| Phase | Scope | Estimate |
|---|---|---|
| 0 | Project foundation: deps, Tailwind/MUI theme bridge, fonts, env, AWS table/bucket/SES setup scripts, health check, logging | 1–2 d |
| 1 | Design system + static storefront (home / shop / product) with mock data | 4–6 d |
| 2 | Data layer + admin product CRUD; categories; replace mock data with real reads | 4–5 d |
| 3 | Authentication (signup, OTP verify, login, reset, middleware, account skeleton, admin bootstrap, rate limits) | 3–4 d |
| 4 | Cart + checkout UI; DB cart with merge; address book; pincode check (shipping mocked) | 4–5 d |
| 5 | Razorpay + COD; signature/webhook verification; refunds | 3–4 d |
| 6 | Emails (Nodemailer + React Email + SES); admin order management + audit log | 2–3 d |
| 7 | Shiprocket integration (serviceability, create shipment, label, tracking webhook, customer tracking page) | 3–4 d |
| 8 | Coupons, banners, content (blog + static pages), reviews, wishlist, customer management | 4–6 d |
| 9 | Polish: SEO, analytics, Sentry, a11y audit, Lighthouse pass, Playwright E2E, Vercel deploy, live keys, DynamoDB PITR drill | 3–5 d |

**Total:** ~6–9 weeks single-developer, full focus.

## 15. Out of Scope (Future Phases)

Multi-language, multi-currency, gift cards, subscriptions / auto-reorder, native mobile app, headless commerce API, marketplace / multi-vendor, advanced search via Algolia or OpenSearch (we use DynamoDB filtering + a denormalised search-tokens field initially; upgrade later if traffic and dataset justify it).

## 16. Environment Variables (Reference List)

```
# Next.js
NEXT_PUBLIC_SITE_URL=
NODE_ENV=

# Auth
JWT_ACCESS_SECRET=
SESSION_COOKIE_NAME=
ADMIN_BOOTSTRAP_EMAIL=
ADMIN_BOOTSTRAP_PASSWORD=

# AWS
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DDB_TABLE_PREFIX=                # e.g. prod_

# S3 / CloudFront
S3_BUCKET=
S3_PUBLIC_PREFIX=
CDN_BASE_URL=

# Email (SES SMTP via Nodemailer)
SES_SMTP_HOST=
SES_SMTP_PORT=
SES_SMTP_USER=
SES_SMTP_PASSWORD=
MAIL_FROM=
ADMIN_NOTIFY_EMAIL=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Shiprocket
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
SHIPROCKET_WEBHOOK_SECRET=

# Misc
RATE_LIMIT_SALT=
```

## 17. Open Questions / Confirmations Needed Before Plan

None at design-spec level. Detail-level decisions (exact SES region, exact Razorpay plan, exact GST rules per category, exact font licenses) surface during their phase implementation plans.
