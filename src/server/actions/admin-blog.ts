"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { blogPostsRepo, type BlogPostInput } from "@/lib/db/repos/blog-posts";
import type { BlogPost, BlogPostStatus } from "@/types/domain";

export type BlogPostActionResult = { ok: true; post: BlogPost } | { ok: false; error: string };

export type DeleteBlogPostResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

function normaliseTags(tags: string[] | undefined): string[] {
  return (
    (tags ?? [])
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
      // De-dupe while preserving order.
      .filter((t, i, arr) => arr.indexOf(t) === i)
  );
}

function normaliseInput(input: BlogPostInput): BlogPostInput {
  return {
    slug: input.slug.trim().toLowerCase(),
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    body: input.body,
    coverImageUrl: input.coverImageUrl.trim(),
    coverImageAlt: input.coverImageAlt.trim(),
    authorName: input.authorName.trim(),
    tags: normaliseTags(input.tags),
    status: input.status,
  };
}

function validationError(input: BlogPostInput): string | null {
  if (!input.title) return "Title is required.";
  if (!input.slug) return "Slug is required.";
  if (!input.excerpt) return "A short excerpt is required.";
  if (!input.body.trim()) return "Body is required.";
  if (!input.coverImageUrl) return "A cover image is required.";
  if (!input.coverImageAlt) return "Cover image alt text is required.";
  if (!input.authorName) return "Author name is required.";
  return null;
}

function revalidateAll(slug: string) {
  // The list, the post itself, and any layout that pulls in journal previews.
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");
  revalidatePath("/", "layout");
}

export async function createBlogPostAction(input: BlogPostInput): Promise<BlogPostActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const clean = normaliseInput(input);
  const validation = validationError(clean);
  if (validation) return { ok: false, error: validation };
  try {
    const post = await blogPostsRepo.create(clean);
    revalidateAll(post.slug);
    return { ok: true, post };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create post." };
  }
}

export async function updateBlogPostAction(
  id: string,
  input: BlogPostInput,
): Promise<BlogPostActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const clean = normaliseInput(input);
  const validation = validationError(clean);
  if (validation) return { ok: false, error: validation };
  try {
    const existing = await blogPostsRepo.getById(id);
    if (!existing) return { ok: false, error: "Post not found." };
    const updated = await blogPostsRepo.update(id, clean);
    if (!updated) return { ok: false, error: "Post not found." };
    // If the slug changed, the old URL still gets a 404 from the storefront
    // until its cache entry expires — kick it explicitly.
    if (existing.slug !== updated.slug) {
      revalidatePath(`/blog/${existing.slug}`);
    }
    revalidateAll(updated.slug);
    return { ok: true, post: updated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update post." };
  }
}

export async function setBlogPostStatusAction(
  id: string,
  status: BlogPostStatus,
): Promise<BlogPostActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const existing = await blogPostsRepo.getById(id);
    if (!existing) return { ok: false, error: "Post not found." };
    const updated = await blogPostsRepo.update(id, { status });
    if (!updated) return { ok: false, error: "Post not found." };
    revalidateAll(updated.slug);
    return { ok: true, post: updated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update status." };
  }
}

export async function deleteBlogPostAction(id: string): Promise<DeleteBlogPostResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const existing = await blogPostsRepo.getById(id);
    if (!existing) return { ok: true };
    await blogPostsRepo.delete(id);
    revalidatePath("/blog");
    revalidatePath(`/blog/${existing.slug}`);
    revalidatePath("/admin/blog");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete post." };
  }
}
