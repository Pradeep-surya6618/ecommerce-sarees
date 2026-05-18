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
