# Phase 8 — Blog + Static Pages + Admin Settings (Final UI-Only Phase)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the UI-only build: a journal/blog (list + detail), six static content pages (about, contact, plus five policies), and an admin settings page showing store profile, tax, and COD fee. After this phase the entire customer + admin surface is clickable; subsequent phases swap mock repos for real DynamoDB, real auth crypto, real Razorpay, real Shiprocket, real SES.

**Scope decisions:**

- **Blog body** is plain text with paragraph-break-on-double-newline rendering — no markdown library, no Tiptap. Admin blog editor is deferred to a backend phase.
- **Static pages** are hand-authored TSX components in `/app/(storefront)/(static)/...` — no admin CMS for them in this phase.
- **Settings page** is read-only display of mock data. The toggle for "COD fee" is interactive but only updates an in-memory store entry; no Server Action persists across restart.

**Architecture:** Adds `BlogPost` type + `BLOG_POSTS_FIXTURE` + `blogPostsRepo` (mock, TDD). Static pages are simple Server Components rendering hand-authored prose with the existing UI primitives.

**Reference spec:** §13 (storefront pages), §12 (settings).

---

## File Map

```
✎ src/types/domain.ts                                      # BlogPost type
✚ src/lib/db/fixtures/blog-posts.ts                        # 3-4 sample posts
✚ src/lib/db/repos/blog-posts.ts                           # mock repo
✚ src/lib/db/repos/blog-posts.test.ts
✚ src/components/storefront/ProsePage.tsx                  # shared layout for static pages
✚ src/components/storefront/BlogCard.tsx
✚ src/components/storefront/BlogBody.tsx                   # paragraph splitter
✚ src/app/(storefront)/blog/page.tsx                       # list
✚ src/app/(storefront)/blog/[slug]/page.tsx                # detail
✚ src/app/(storefront)/(static)/about/page.tsx
✚ src/app/(storefront)/(static)/contact/page.tsx
✚ src/app/(storefront)/(static)/policies/shipping/page.tsx
✚ src/app/(storefront)/(static)/policies/returns/page.tsx
✚ src/app/(storefront)/(static)/policies/care/page.tsx
✚ src/app/(storefront)/(static)/policies/terms/page.tsx
✚ src/app/(storefront)/(static)/policies/privacy/page.tsx
✚ src/app/(admin)/admin/settings/page.tsx
✚ tests/e2e/blog-static.spec.ts
```

---

## Task 1: BlogPost type

Append to `src/types/domain.ts`:

```ts
export type BlogPostStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string; // plain text; paragraphs separated by blank lines
  coverImageUrl: string;
  coverImageAlt: string;
  authorName: string;
  tags: string[];
  status: BlogPostStatus;
  publishedAt: string; // ISO; only meaningful if status === "published"
  createdAt: string;
  updatedAt: string;
}
```

Commit: `feat(types): add BlogPost type`

---

## Task 2: Blog posts fixture

Create `src/lib/db/fixtures/blog-posts.ts` with 4 posts that read like real saree-shop blog content. Use Unsplash image URLs already vetted in earlier fixtures.

```ts
import type { BlogPost } from "@/types/domain";

const IVORY =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80";
const MAROON =
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1600&q=80";
const GREEN =
  "https://images.unsplash.com/photo-1610030469973-e1b80fb95e36?auto=format&fit=crop&w=1600&q=80";
const LINEN =
  "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=1600&q=80";

export const BLOG_POSTS_FIXTURE: BlogPost[] = [
  {
    id: "post_kanjivaram_guide",
    slug: "how-to-choose-a-kanjivaram",
    title: "How to choose a Kanjivaram, the right way",
    excerpt:
      "A practical guide to weights, weaves, zari grades, and what truly matters when you bring home a Kanjivaram.",
    body: `A real Kanjivaram begins with two things: pure mulberry silk and pure zari. Everything else — the motifs, the border width, the pallu length — is taste.

When you hold a Kanjivaram, weight is a reasonable proxy for honesty. Six-yard pieces typically sit between 700 grams and 900 grams. Anything lighter is either tissue-blended or finer-count silk; both are valid choices but priced differently.

Zari grades are stamped by the Silk Mark. Look for the holographic sticker on the pallu. If a piece is being sold without the Silk Mark and the seller can't explain why, walk away.

Motifs come in pairs: temple, mango, peacock, parrot, lotus, vine. Designers pair a motif with a complementary border — a temple border with mango butti, a mango border with vine butti. Mixing motifs without intent reads as showy.

The last test: ask the seller where the saree was woven. Kanchipuram is the gold standard. A good seller will name the cooperative and tell you something about the weaver. If the answer is vague, the saree probably wasn't woven there.`,
    coverImageUrl: MAROON,
    coverImageAlt: "Maroon Kanjivaram detail",
    authorName: "Mira Iyer",
    tags: ["kanjivaram", "guide", "silk"],
    status: "published",
    publishedAt: "2026-04-22T09:00:00Z",
    createdAt: "2026-04-22T09:00:00Z",
    updatedAt: "2026-04-22T09:00:00Z",
  },
  {
    id: "post_caring_for_silk",
    slug: "how-to-care-for-silk-sarees",
    title: "Caring for silk: the four rules that matter",
    excerpt: "Storage, washing, ironing, repair — what to actually do, in order.",
    body: `Silk is a protein fibre. It dislikes water, heat, and direct sunlight. Build your routine around those three facts and your saree will last decades.

Storage. Fold loosely along the existing creases and wrap in unbleached cotton or muslin. Refold every six months along a different line so the same fibres don't bear the stress.

Washing. Dry clean for the first wash. After that, only spot-clean with a damp white cloth. Soap of any kind dulls zari; if the saree absolutely has to be cleaned, use a saree dhobi who works with pure silks.

Ironing. Reverse side, low temperature, no steam. Place a thin cotton dupatta between the iron and the pallu.

Repair. If a thread pulls, take it to a karigar. Don't snip — pulled threads can be coaxed back through with patience.`,
    coverImageUrl: IVORY,
    coverImageAlt: "Folded ivory saree",
    authorName: "Mira Iyer",
    tags: ["care", "silk"],
    status: "published",
    publishedAt: "2026-04-18T09:00:00Z",
    createdAt: "2026-04-18T09:00:00Z",
    updatedAt: "2026-04-18T09:00:00Z",
  },
  {
    id: "post_workweek_drapes",
    slug: "five-sarees-for-the-working-week",
    title: "Five sarees for the working week",
    excerpt: "Crisp drapes that survive a 9-to-7 and still photograph well at the coffee machine.",
    body: `Office sarees are a constraint problem. They have to be light, wrinkle-resistant, and quiet enough not to compete with the work.

Linen wins by default. Hand-block prints in muted colour blocks read as serious. Pair with a structured blouse and minimum jewellery.

Khadi is the dark horse. It softens beautifully after three washes and never looks try-hard.

Pochampally ikat in a single colour is a quiet flex. The pattern is enough; let the rest of the look stay neutral.

Mysore silk in plain rust or teal makes Tuesday feel like Friday. Keep the border narrow.

Hand-block cotton for the heaviest meetings. Wide pleats, no pallu drama, and crisp ironing the night before.`,
    coverImageUrl: LINEN,
    coverImageAlt: "Linen saree draped over chair",
    authorName: "Anita Sharma",
    tags: ["office", "linen", "cotton"],
    status: "published",
    publishedAt: "2026-04-08T09:00:00Z",
    createdAt: "2026-04-08T09:00:00Z",
    updatedAt: "2026-04-08T09:00:00Z",
  },
  {
    id: "post_paithani_origins",
    slug: "the-paithani-and-its-peacocks",
    title: "The Paithani and its peacocks",
    excerpt:
      "Why a saree from a small Maharashtrian town became the most coveted piece on every bridal trunk.",
    body: `Paithan is a small town on the banks of the Godavari, half an hour from Aurangabad. It is the original home of the Paithani.

The defining feature is the woven peacock, threaded into the pallu using kadhwa weaving — a single-shuttle technique where each motif is hand-inserted. A traditional Paithani peacock takes a weaver between three and seven days for the pallu alone.

Colour pairings follow strict rules: peacock green with pink, magenta with parrot green, royal blue with yellow. A Paithani in a "modern" colour like ivory is usually a contemporary piece — beautiful, but not in the lineage.

A new Paithani feels stiff because the silk is unwashed. Drape it once, then let it rest for two weeks. The second wear is the one that flows.`,
    coverImageUrl: GREEN,
    coverImageAlt: "Green Paithani pallu",
    authorName: "Mira Iyer",
    tags: ["paithani", "heritage", "silk"],
    status: "published",
    publishedAt: "2026-03-30T09:00:00Z",
    createdAt: "2026-03-30T09:00:00Z",
    updatedAt: "2026-03-30T09:00:00Z",
  },
];
```

Commit: `feat(fixtures): add 4 blog post fixtures`

---

## Task 3: blogPostsRepo (mock, TDD)

`src/lib/db/repos/blog-posts.ts`:

```ts
import { BLOG_POSTS_FIXTURE } from "@/lib/db/fixtures/blog-posts";
import type { BlogPost } from "@/types/domain";

declare global {
  // eslint-disable-next-line no-var
  var __mockBlogPosts: Map<string, BlogPost> | undefined;
}

function getStore(): Map<string, BlogPost> {
  if (globalThis.__mockBlogPosts) return globalThis.__mockBlogPosts;
  const store = new Map<string, BlogPost>();
  for (const p of BLOG_POSTS_FIXTURE) store.set(p.id, p);
  globalThis.__mockBlogPosts = store;
  return store;
}

export interface BlogPostsRepo {
  listPublished(options?: { limit?: number }): Promise<BlogPost[]>;
  getBySlug(slug: string): Promise<BlogPost | null>;
  listRelated(currentSlug: string, options?: { limit?: number }): Promise<BlogPost[]>;
}

function sortNewestFirst(a: BlogPost, b: BlogPost): number {
  return a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0;
}

export const blogPostsRepo: BlogPostsRepo = {
  async listPublished(options) {
    const items = [...getStore().values()]
      .filter((p) => p.status === "published")
      .sort(sortNewestFirst);
    return options?.limit ? items.slice(0, options.limit) : items;
  },

  async getBySlug(slug) {
    return (
      [...getStore().values()].find((p) => p.slug === slug && p.status === "published") ?? null
    );
  },

  async listRelated(currentSlug, options) {
    const current = await this.getBySlug(currentSlug);
    if (!current) return [];
    const items = [...getStore().values()]
      .filter((p) => p.status === "published" && p.slug !== currentSlug)
      .map((p) => {
        const shared = p.tags.filter((t) => current.tags.includes(t)).length;
        return { post: p, shared };
      })
      .filter((x) => x.shared > 0)
      .sort((a, b) => b.shared - a.shared || sortNewestFirst(a.post, b.post))
      .map((x) => x.post);
    return options?.limit ? items.slice(0, options.limit) : items;
  },
};

export function __resetBlogPostsRepo(): void {
  globalThis.__mockBlogPosts = undefined;
}
```

Test `src/lib/db/repos/blog-posts.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { __resetBlogPostsRepo, blogPostsRepo } from "./blog-posts";

describe("blogPostsRepo (mock)", () => {
  beforeEach(() => __resetBlogPostsRepo());

  it("lists published posts newest first", async () => {
    const list = await blogPostsRepo.listPublished();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((p) => p.status === "published")).toBe(true);
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1]!.publishedAt >= list[i]!.publishedAt).toBe(true);
    }
  });

  it("gets a post by slug", async () => {
    const post = await blogPostsRepo.getBySlug("how-to-choose-a-kanjivaram");
    expect(post?.title).toContain("Kanjivaram");
  });

  it("returns null for an unknown slug", async () => {
    expect(await blogPostsRepo.getBySlug("does-not-exist")).toBeNull();
  });

  it("returns related posts based on shared tags", async () => {
    const related = await blogPostsRepo.listRelated("how-to-choose-a-kanjivaram", { limit: 2 });
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((p) => p.slug !== "how-to-choose-a-kanjivaram")).toBe(true);
  });
});
```

Commit: `feat(repos): add mock blogPostsRepo with related-by-tags`

---

## Task 4: Storefront components

### `src/components/storefront/BlogBody.tsx`

Renders plain text body, splitting on blank lines into paragraphs:

```tsx
export function BlogBody({ body }: { body: string }) {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="flex flex-col gap-5 text-ink-700 [&_p]:leading-relaxed">
      {paragraphs.map((p, idx) => (
        <p key={idx}>{p}</p>
      ))}
    </div>
  );
}
```

### `src/components/storefront/BlogCard.tsx`

```tsx
import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/types/domain";

export function BlogCard({ post }: { post: BlogPost }) {
  const date = new Date(post.publishedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-ink-500/5">
        <Image
          src={post.coverImageUrl}
          alt={post.coverImageAlt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-accent-gold">{date}</span>
        <h3 className="font-display text-xl text-ink-900 transition group-hover:text-accent-primary">
          {post.title}
        </h3>
        <p className="text-sm text-ink-700">{post.excerpt}</p>
      </div>
    </Link>
  );
}
```

### `src/components/storefront/ProsePage.tsx`

Generic shell for the static policy/about/contact pages:

```tsx
import type { ReactNode } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";

export interface ProsePageProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  children: ReactNode;
}

export function ProsePage({ title, description, breadcrumb, children }: ProsePageProps) {
  return (
    <Container size="md" className="py-12">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <header className="mt-6 flex flex-col gap-2 pb-8">
        <h1 className="font-display text-3xl text-ink-900 md:text-5xl">{title}</h1>
        {description && <p className="text-ink-700">{description}</p>}
      </header>
      <div className="prose-like flex flex-col gap-5 text-ink-700 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink-900 [&_h2]:mt-6 [&_p]:leading-relaxed">
        {children}
      </div>
    </Container>
  );
}
```

Commit: `feat(storefront): add BlogBody, BlogCard, ProsePage components`

---

## Task 5: Blog list + detail pages

`src/app/(storefront)/blog/page.tsx`:

```tsx
import { blogPostsRepo } from "@/lib/db/repos/blog-posts";
import { BlogCard } from "@/components/storefront/BlogCard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Journal · Saree Store",
  description: "Notes on weaves, care, and the craft of choosing a saree.",
};

export default async function BlogIndexPage() {
  const posts = await blogPostsRepo.listPublished();
  const [first, ...rest] = posts;
  return (
    <Container size="xl" className="py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Journal" }]} />
      <header className="mt-6 flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">The Journal</span>
        <h1 className="font-display text-3xl text-ink-900 md:text-5xl">
          Notes on weaves, craft, and care.
        </h1>
      </header>
      {first && (
        <section className="mt-12">
          <BlogCard post={first} />
        </section>
      )}
      <section className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((p) => (
          <BlogCard key={p.id} post={p} />
        ))}
      </section>
    </Container>
  );
}
```

`src/app/(storefront)/blog/[slug]/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPostsRepo } from "@/lib/db/repos/blog-posts";
import { BlogBody } from "@/components/storefront/BlogBody";
import { BlogCard } from "@/components/storefront/BlogCard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await blogPostsRepo.getBySlug(slug);
  if (!post) return { title: "Journal · Saree Store" };
  return {
    title: `${post.title} · Saree Store`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImageUrl }],
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await blogPostsRepo.getBySlug(slug);
  if (!post) notFound();
  const related = await blogPostsRepo.listRelated(slug, { limit: 3 });
  const date = new Date(post.publishedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Container size="md" className="py-12">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Journal", href: "/blog" },
            { label: post.title },
          ]}
        />
        <article className="mt-8 flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">{date}</span>
            <h1 className="font-display text-3xl text-ink-900 md:text-5xl">{post.title}</h1>
            <p className="text-ink-700">{post.excerpt}</p>
            <span className="text-sm text-ink-500">By {post.authorName}</span>
          </header>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-ink-500/5">
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt}
              fill
              sizes="(min-width: 1024px) 800px, 100vw"
              priority
              className="object-cover"
            />
          </div>
          <BlogBody body={post.body} />
          <div className="flex flex-wrap gap-2 pt-4">
            {post.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        </article>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-ink-500/10 py-16">
          <Container size="xl">
            <h2 className="mb-8 font-display text-2xl text-ink-900">More from the Journal</h2>
            <div className="grid gap-10 md:grid-cols-3">
              {related.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
            <div className="mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-sm border border-ink-900 px-5 py-2.5 text-sm font-medium text-ink-900 transition hover:bg-ink-900 hover:text-white"
              >
                All posts
              </Link>
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
```

Commit: `feat(blog): add /blog list and /blog/[slug] detail pages`

---

## Task 6: Seven static pages

All under `src/app/(storefront)/(static)/` so the `(static)` group lets us add a shared layout later if needed (none required for Phase 8).

### `/about` (`about/page.tsx`)

```tsx
import Image from "next/image";
import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Our story · Saree Store" };

export default function AboutPage() {
  return (
    <ProsePage
      title="Our story"
      description="Sarees, sourced directly from weavers across India."
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Our story" }]}
    >
      <p>
        Saree Store began as a notebook of weavers. Over four years we have walked through
        Kanchipuram, Varanasi, Paithan, Pochampally, Maheshwar, and the Bengali looms — meeting the
        people behind the pieces, learning what makes each tradition specific, and building
        relationships that let us bring their work to a wider audience without losing the thread of
        the craft.
      </p>
      <div className="relative my-2 aspect-[16/9] overflow-hidden rounded-md">
        <Image
          src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80"
          alt="Weaver at a handloom"
          fill
          sizes="(min-width: 768px) 700px, 100vw"
          className="object-cover"
        />
      </div>
      <h2>What we believe</h2>
      <p>
        Heritage isn&apos;t a marketing word. It is a record of decisions — fibre, dye, motif,
        proportion — that have survived because they worked. We try to honour those decisions and
        explain them clearly enough that customers can recognise them, too.
      </p>
      <h2>Who works on this</h2>
      <p>
        A small team across Bengaluru and Kanchipuram. We work with cooperatives that pay weavers
        above the regional floor; that pay arrives before our pieces ship. Photography is in-house.
        Customer service goes to humans, not bots.
      </p>
    </ProsePage>
  );
}
```

### `/contact` (`contact/page.tsx`)

```tsx
import { Mail, MapPin, Phone } from "lucide-react";
import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Contact us · Saree Store" };

export default function ContactPage() {
  return (
    <ProsePage
      title="Get in touch"
      description="Questions about a piece, a custom request, an order — we read every message."
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Contact" }]}
    >
      <div className="not-prose grid gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Mail className="h-5 w-5 text-accent-gold" />
          <p className="text-sm text-ink-700">hello@sareestore.example</p>
          <p className="text-xs text-ink-500">Replies within one business day.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Phone className="h-5 w-5 text-accent-gold" />
          <p className="text-sm text-ink-700">+91 80 4567 8901</p>
          <p className="text-xs text-ink-500">Mon–Sat, 10:00–18:00 IST.</p>
        </div>
        <div className="flex flex-col gap-2">
          <MapPin className="h-5 w-5 text-accent-gold" />
          <p className="text-sm text-ink-700">
            Saree Store, 27 Lavelle Road,
            <br />
            Bengaluru 560001, KA, India.
          </p>
        </div>
      </div>
      <h2>Wholesale &amp; press</h2>
      <p>
        For bulk corporate gifting, wholesale enquiries, or press requests, write to
        partnerships@sareestore.example. Include your country, brand, and any timeline.
      </p>
    </ProsePage>
  );
}
```

### `/policies/shipping`

```tsx
import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Shipping · Saree Store" };

export default function ShippingPolicyPage() {
  return (
    <ProsePage
      title="Shipping"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Policies", href: "/policies/shipping" },
        { label: "Shipping" },
      ]}
    >
      <p>
        Free shipping pan-India on orders over ₹2,000. Below that, standard delivery is ₹80 and
        express is ₹200.
      </p>
      <h2>How long it takes</h2>
      <p>
        Standard delivery lands in 5 business days. Express in 2. The pincode checker on each
        product page gives the canonical estimate for your address.
      </p>
      <h2>Cash on delivery</h2>
      <p>
        COD is available across most Indian pincodes. Selected remote pincodes are prepaid only;
        we&apos;ll flag this at checkout if it applies.
      </p>
      <h2>International shipping</h2>
      <p>
        Not currently. Please email us if you&apos;d like an international quote; we can arrange
        ad-hoc shipping for orders above ₹50,000 with import duties handled at destination.
      </p>
    </ProsePage>
  );
}
```

### `/policies/returns`

```tsx
import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Returns · Saree Store" };

export default function ReturnsPolicyPage() {
  return (
    <ProsePage
      title="Returns"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Policies", href: "/policies/shipping" },
        { label: "Returns" },
      ]}
    >
      <p>
        Seven days from delivery for unworn pieces with tags intact. Pre-stitched and made-to-order
        items are non-returnable.
      </p>
      <h2>How to start a return</h2>
      <p>
        Email returns@sareestore.example with your order id and a photo of the piece. We&apos;ll
        arrange reverse pickup at no charge. Refund lands within 5 business days of receipt.
      </p>
      <h2>Damaged or wrong piece</h2>
      <p>
        If a piece arrives damaged or different from what you ordered, photograph it before
        unfolding and write to us within 48 hours. We&apos;ll cover everything, no questions.
      </p>
    </ProsePage>
  );
}
```

### `/policies/care`

```tsx
import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Saree care · Saree Store" };

export default function CarePolicyPage() {
  return (
    <ProsePage
      title="Saree care"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Policies", href: "/policies/shipping" },
        { label: "Saree care" },
      ]}
    >
      <p>Each fibre has its rules. The short version:</p>
      <h2>Silk</h2>
      <p>
        Dry clean for the first wash. After that, only spot-clean. Iron reverse-side, low
        temperature, with a thin cotton between the iron and the saree. Store folded in unbleached
        cotton. Refold along a different line every six months.
      </p>
      <h2>Cotton</h2>
      <p>
        Cold-water hand-wash with a mild detergent. Don&apos;t wring. Air-dry in the shade. Iron
        while slightly damp for the best crease.
      </p>
      <h2>Linen</h2>
      <p>Gentle machine wash on cold. Linen wrinkles by design; lean into it.</p>
      <h2>Designer pieces with embellishments</h2>
      <p>
        Always dry clean. Never spray perfume or hairspray directly onto sequins, beads, or zardosi.
      </p>
    </ProsePage>
  );
}
```

### `/policies/terms`

```tsx
import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Terms · Saree Store" };

export default function TermsPolicyPage() {
  return (
    <ProsePage
      title="Terms of service"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Policies", href: "/policies/shipping" },
        { label: "Terms" },
      ]}
    >
      <p>
        These are the working terms for using Saree Store. We try to keep them short. If anything is
        unclear, write to hello@sareestore.example and we&apos;ll explain.
      </p>
      <h2>Orders</h2>
      <p>
        An order is confirmed only when you receive an email confirmation. If a piece sells out
        between you adding it to cart and us processing, we&apos;ll refund or offer an alternative.
      </p>
      <h2>Pricing &amp; taxes</h2>
      <p>
        All prices are in INR and inclusive of 5% GST for sarees. Shipping is charged separately and
        shown at checkout.
      </p>
      <h2>Account use</h2>
      <p>
        Don&apos;t share your account credentials. We&apos;ll never ask for them. If you suspect
        unauthorised access, change your password immediately and write to us.
      </p>
    </ProsePage>
  );
}
```

### `/policies/privacy`

```tsx
import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Privacy · Saree Store" };

export default function PrivacyPolicyPage() {
  return (
    <ProsePage
      title="Privacy"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Policies", href: "/policies/shipping" },
        { label: "Privacy" },
      ]}
    >
      <p>
        We collect only what we need to ship your sarees and respond to your messages: name, email,
        phone, and delivery address. We store this in our database and don&apos;t sell or share it
        with third parties.
      </p>
      <h2>Payments</h2>
      <p>
        Card numbers and UPI handles are never seen by our servers. Razorpay processes payments
        directly; we only store the order&apos;s transaction reference.
      </p>
      <h2>Email</h2>
      <p>
        We send transactional email about your orders. You can opt in to occasional product updates
        separately; you can unsubscribe any time.
      </p>
      <h2>Your rights</h2>
      <p>
        Email privacy@sareestore.example to request a copy or deletion of your account data. We
        respond within 30 days.
      </p>
    </ProsePage>
  );
}
```

Commit: `feat(static): add 7 static pages (about, contact, 5 policies)`

---

## Task 7: Admin settings page

A read-only page showing store profile + tax + COD fee + Razorpay/Shiprocket key status. The COD fee toggle is interactive but stores state only in-memory and resets on restart — explicit demo limitation.

`src/app/(admin)/admin/settings/page.tsx`:

```tsx
import { ProsePage } from "@/components/storefront/ProsePage"; // not used — placeholder import marker to delete
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Settings · Admin" };

const STORE = {
  legalName: "Saree Store Private Limited",
  tradeName: "Saree Store",
  gstNumber: "29ABCDE1234F1Z5",
  pan: "ABCDE1234F",
  contactEmail: "hello@sareestore.example",
  phone: "+91 80 4567 8901",
  addressLine: "27 Lavelle Road, Bengaluru 560001, KA",
};

const TAX = {
  gstRate: "5%",
  appliesTo: "All sarees and ethnic wear (HSN 5407, 5408, 5208)",
};

const SHIPPING = {
  freeShippingThreshold: "₹2,000",
  standardRate: "₹80",
  expressRate: "₹200",
};

const KEYS = [
  { label: "Razorpay key id", value: "rzp_test_•••••••••• (demo)", status: "demo" },
  { label: "Razorpay webhook secret", value: "•••••••••• (demo)", status: "demo" },
  { label: "Shiprocket API token", value: "Not connected", status: "missing" },
  { label: "SES SMTP credentials", value: "Not connected", status: "missing" },
];

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-3xl text-ink-900">Settings</h1>
        <p className="text-sm text-ink-700">
          Store profile, tax, shipping, and integration keys. Editable in a later backend phase.
        </p>
      </header>

      <Section title="Store profile">
        <Field label="Legal name" value={STORE.legalName} />
        <Field label="Trade name" value={STORE.tradeName} />
        <Field label="GST number" value={STORE.gstNumber} mono />
        <Field label="PAN" value={STORE.pan} mono />
        <Field label="Contact email" value={STORE.contactEmail} />
        <Field label="Phone" value={STORE.phone} />
        <Field label="Address" value={STORE.addressLine} />
      </Section>

      <Section title="Tax">
        <Field label="GST rate" value={TAX.gstRate} />
        <Field label="Applies to" value={TAX.appliesTo} />
      </Section>

      <Section title="Shipping">
        <Field label="Free shipping threshold" value={SHIPPING.freeShippingThreshold} />
        <Field label="Standard rate" value={SHIPPING.standardRate} />
        <Field label="Express rate" value={SHIPPING.expressRate} />
      </Section>

      <Section title="Integrations">
        {KEYS.map((k) => (
          <div
            key={k.label}
            className="flex items-center justify-between border-b border-ink-500/10 py-3 last:border-b-0"
          >
            <span className="text-xs uppercase tracking-wide text-ink-500">{k.label}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-ink-900">{k.value}</span>
              <Badge tone={k.status === "demo" ? "gold" : "danger"}>
                {k.status === "demo" ? "Demo" : "Missing"}
              </Badge>
            </div>
          </div>
        ))}
      </Section>

      <p className="rounded-sm border border-accent-gold/40 bg-accent-gold/10 p-3 text-xs text-ink-700">
        Editing settings, key rotation, and webhook configuration arrive when the backend phase
        wires real Razorpay, Shiprocket, and SES.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
      <h2 className="mb-4 font-display text-xl text-ink-900">{title}</h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink-500/10 py-3 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-ink-500">{label}</span>
      <span className={mono ? "font-mono text-sm text-ink-900" : "text-sm text-ink-900"}>
        {value}
      </span>
    </div>
  );
}
```

Drop the unused `import { ProsePage }` line — the snippet above accidentally references it. Use only `Badge`.

Commit: `feat(admin): add read-only settings page`

---

## Task 8: E2E

`tests/e2e/blog-static.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.describe("Blog and static pages", () => {
  test("/blog list renders posts and a card links to detail", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const postLinks = page.locator("a[href^='/blog/']");
    expect(await postLinks.count()).toBeGreaterThan(0);
  });

  test("/blog/[slug] detail renders title and body paragraphs", async ({ page }) => {
    await page.goto("/blog/how-to-choose-a-kanjivaram");
    await expect(page.getByRole("heading", { level: 1, name: /Kanjivaram/i })).toBeVisible();
    const paragraphs = page.locator("article p");
    expect(await paragraphs.count()).toBeGreaterThan(2);
  });

  test("/about, /contact, and /policies/shipping all return 200 and render a heading", async ({
    page,
  }) => {
    for (const path of [
      "/about",
      "/contact",
      "/policies/shipping",
      "/policies/returns",
      "/policies/care",
      "/policies/terms",
      "/policies/privacy",
    ]) {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });
});
```

Also add an admin settings test:

```ts
test.describe("Admin settings page", () => {
  test("admin can reach /admin/settings", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/^Email/i).fill("admin@example.com");
    await page.getByLabel(/^Password/i).fill("AdminDemo!23");
    await page.getByRole("button", { name: /^Sign in$/i }).click();
    await page.waitForURL(/\/admin(\?|$)/);
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { level: 1, name: /Settings/ })).toBeVisible();
  });
});
```

Commit: `test(e2e): blog, static pages, admin settings`

---

## Task 9: Final verification + tag

```powershell
npx prettier --check .
npx eslint .
npx tsc --noEmit
npx vitest run
npx next build
npm run e2e
```

Tag `phase-8-complete` with deliverable summary.

---

## What's NOT in this phase

- **Admin blog editor + admin static-page editor** — backend phase (needs richer text + image handling).
- **Settings editing** — backend phase.
- **Real markdown / Tiptap rendering** — backend phase; current blog body is plain text with paragraph splits.
- **Newsletter** form submission action — the footer form is still purely visual.

## Spec coverage (§13 storefront + §12 admin settings)

- Blog list + detail ✓
- About, contact, shipping, returns, care, terms, privacy ✓
- Admin settings (read-only) ✓
- Admin blog/static-page editors — deferred (documented above)
- Newsletter submission — deferred
