import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { BlogPost, BlogPostStatus } from "@/types/domain";

export interface BlogPostInput {
  slug: string;
  title: string;
  excerpt: string;
  body: string; // markdown
  coverImageUrl: string;
  coverImageAlt: string;
  authorName: string;
  tags: string[];
  status: BlogPostStatus;
}

export interface BlogPostsRepo {
  // Storefront reads — only published posts visible.
  listPublished(options?: { limit?: number }): Promise<BlogPost[]>;
  getBySlug(slug: string): Promise<BlogPost | null>;
  listRelated(currentSlug: string, options?: { limit?: number }): Promise<BlogPost[]>;
  // Admin reads — includes drafts.
  listAll(): Promise<BlogPost[]>;
  getById(id: string): Promise<BlogPost | null>;
  // Admin writes.
  create(input: BlogPostInput): Promise<BlogPost>;
  update(id: string, input: Partial<BlogPostInput>): Promise<BlogPost | null>;
  delete(id: string): Promise<void>;
}

// Blog posts live in the Content table alongside pages/banners/etc.
//   PK = "POST#<id>"
//   SK = "META"
//   entity = "blogPost"
// Slug uniqueness is enforced at write time via a Scan-then-check — fine at
// the row counts blog content runs at (10s to low 100s).

const PK_PREFIX = "POST#";

function postPk(id: string): string {
  return `${PK_PREFIX}${id}`;
}

function table(): string {
  return tableName(TABLES.Content);
}

function nowIso(): string {
  return new Date().toISOString();
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

interface PostItem extends BlogPost {
  pk: string;
  sk: string;
  entity: "blogPost";
}

function toItem(post: BlogPost): PostItem {
  return { ...post, pk: postPk(post.id), sk: "META", entity: "blogPost" };
}

function fromItem(item: Record<string, unknown> | undefined): BlogPost | null {
  if (!item) return null;
  if ((item as { entity?: string }).entity !== "blogPost") return null;
  const { pk: _pk, sk: _sk, entity: _e, ...rest } = item as PostItem;
  return rest as BlogPost;
}

async function scanPosts(): Promise<BlogPost[]> {
  const out: BlogPost[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await getDdbDoc().send(
      new ScanCommand({
        TableName: table(),
        FilterExpression: "entity = :e",
        ExpressionAttributeValues: { ":e": "blogPost" },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of res.Items ?? []) {
      const post = fromItem(item);
      if (post) out.push(post);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

function sortNewestFirst(a: BlogPost, b: BlogPost): number {
  return a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0;
}

async function findBySlug(slug: string): Promise<BlogPost | null> {
  const all = await scanPosts();
  return all.find((p) => p.slug === slug) ?? null;
}

export const blogPostsRepo: BlogPostsRepo = {
  async listPublished(options) {
    const items = (await scanPosts()).filter((p) => p.status === "published").sort(sortNewestFirst);
    return options?.limit ? items.slice(0, options.limit) : items;
  },

  async getBySlug(slug) {
    const post = await findBySlug(slug);
    if (!post || post.status !== "published") return null;
    return post;
  },

  async listRelated(currentSlug, options) {
    const current = await findBySlug(currentSlug);
    if (!current) return [];
    const items = (await scanPosts())
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

  async listAll() {
    return (await scanPosts()).sort(sortNewestFirst);
  },

  async getById(id) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { pk: postPk(id), sk: "META" },
      }),
    );
    return fromItem(res.Item);
  },

  async create(input) {
    if (!isValidSlug(input.slug)) {
      throw new Error("Slug must be lowercase letters, numbers, and hyphens only.");
    }
    const clash = await findBySlug(input.slug);
    if (clash) {
      throw new Error(`A post with the slug "${input.slug}" already exists.`);
    }
    const now = nowIso();
    const post: BlogPost = {
      id: `post_${nanoid(10)}`,
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      body: input.body,
      coverImageUrl: input.coverImageUrl,
      coverImageAlt: input.coverImageAlt,
      authorName: input.authorName,
      tags: input.tags,
      status: input.status,
      // Capture publish time when status starts as "published"; otherwise
      // stamp creation time so sorting still works for drafts in the admin.
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(post),
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
    return post;
  },

  async update(id, input) {
    const existing = await blogPostsRepo.getById(id);
    if (!existing) return null;
    if (input.slug !== undefined && input.slug !== existing.slug) {
      if (!isValidSlug(input.slug)) {
        throw new Error("Slug must be lowercase letters, numbers, and hyphens only.");
      }
      const clash = await findBySlug(input.slug);
      if (clash && clash.id !== id) {
        throw new Error(`A post with the slug "${input.slug}" already exists.`);
      }
    }
    // Bump publishedAt when transitioning draft → published so the storefront
    // sees the post as "new". Leave it alone otherwise — editing a published
    // post shouldn't reshuffle the index.
    const transitioningToPublished =
      input.status === "published" && existing.status !== "published";
    const updated: BlogPost = {
      ...existing,
      ...input,
      publishedAt: transitioningToPublished ? nowIso() : existing.publishedAt,
      updatedAt: nowIso(),
    };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(updated),
      }),
    );
    return updated;
  },

  async delete(id) {
    await getDdbDoc().send(
      new DeleteCommand({
        TableName: table(),
        Key: { pk: postPk(id), sk: "META" },
      }),
    );
  },
};
