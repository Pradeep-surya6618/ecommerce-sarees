import type { BlogPost } from "@/types/domain";

declare global {
  var __mockBlogPosts: Map<string, BlogPost> | undefined;
}

function getStore(): Map<string, BlogPost> {
  if (globalThis.__mockBlogPosts) return globalThis.__mockBlogPosts;
  const store = new Map<string, BlogPost>();
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
