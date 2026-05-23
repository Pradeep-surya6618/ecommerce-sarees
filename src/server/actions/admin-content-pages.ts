"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { contentPagesRepo } from "@/lib/db/repos/content-pages";
import type { ContentPage, ContentPageInput } from "@/types/domain";

export type ContentPageActionResult =
  | { ok: true; page: ContentPage }
  | { ok: false; error: string };

export type DeleteContentPageResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

function normaliseInput(input: ContentPageInput): ContentPageInput {
  const externalHref = input.externalHref?.trim() || null;
  return {
    slug: input.slug.trim().toLowerCase(),
    title: input.title.trim(),
    body: input.body,
    footerLabel: input.footerLabel.trim(),
    group: input.group,
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    visible: !!input.visible,
    externalHref,
  };
}

function validationError(input: ContentPageInput): string | null {
  if (!input.title) return "Title is required.";
  if (!input.slug) return "Slug is required.";
  if (!input.footerLabel) return "Footer label is required.";
  return null;
}

function revalidateAll(slug: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/p/${slug}`);
  revalidatePath("/admin/pages");
}

export async function createContentPageAction(
  input: ContentPageInput,
): Promise<ContentPageActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const clean = normaliseInput(input);
  const validation = validationError(clean);
  if (validation) return { ok: false, error: validation };
  try {
    const page = await contentPagesRepo.create(clean);
    revalidateAll(page.slug);
    return { ok: true, page };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create page.";
    return { ok: false, error: message };
  }
}

export async function updateContentPageAction(
  id: string,
  input: ContentPageInput,
): Promise<ContentPageActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const clean = normaliseInput(input);
  const validation = validationError(clean);
  if (validation) return { ok: false, error: validation };
  try {
    const existing = await contentPagesRepo.getById(id);
    if (!existing) return { ok: false, error: "Page not found." };
    // System pages must keep their slug — it's wired to the seeded route.
    const toUpdate: Partial<ContentPageInput> = existing.isSystem
      ? { ...clean, slug: existing.slug }
      : clean;
    const updated = await contentPagesRepo.update(id, toUpdate);
    if (!updated) return { ok: false, error: "Page not found." };
    if (existing.slug !== updated.slug) {
      revalidatePath(`/p/${existing.slug}`);
    }
    revalidateAll(updated.slug);
    return { ok: true, page: updated };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update page.";
    return { ok: false, error: message };
  }
}

export async function deleteContentPageAction(id: string): Promise<DeleteContentPageResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const existing = await contentPagesRepo.getById(id);
    if (!existing) return { ok: true };
    await contentPagesRepo.delete(id);
    revalidatePath("/", "layout");
    revalidatePath(`/p/${existing.slug}`);
    revalidatePath("/admin/pages");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete page.";
    return { ok: false, error: message };
  }
}
