"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { contentPagesRepo } from "@/lib/db/repos/content-pages";
import type { ContentPage, ContentPageInput } from "@/types/domain";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    throw new Error("Admin access required.");
  }
  return user;
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

function validate(input: ContentPageInput) {
  if (!input.title) throw new Error("Title is required.");
  if (!input.slug) throw new Error("Slug is required.");
  if (!input.footerLabel) throw new Error("Footer label is required.");
}

function revalidateAll(slug: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/p/${slug}`);
  revalidatePath("/admin/pages");
}

export async function createContentPageAction(input: ContentPageInput): Promise<ContentPage> {
  await requireAdmin();
  const clean = normaliseInput(input);
  validate(clean);
  const page = await contentPagesRepo.create(clean);
  revalidateAll(page.slug);
  return page;
}

export async function updateContentPageAction(
  id: string,
  input: ContentPageInput,
): Promise<ContentPage> {
  await requireAdmin();
  const clean = normaliseInput(input);
  validate(clean);
  const existing = await contentPagesRepo.getById(id);
  if (!existing) throw new Error("Page not found.");
  // System pages must keep their slug — it's wired to the seeded route.
  const toUpdate: Partial<ContentPageInput> = existing.isSystem
    ? { ...clean, slug: existing.slug }
    : clean;
  const updated = await contentPagesRepo.update(id, toUpdate);
  if (!updated) throw new Error("Page not found.");
  if (existing.slug !== updated.slug) {
    revalidatePath(`/p/${existing.slug}`);
  }
  revalidateAll(updated.slug);
  return updated;
}

export async function deleteContentPageAction(id: string): Promise<void> {
  await requireAdmin();
  const existing = await contentPagesRepo.getById(id);
  if (!existing) return;
  await contentPagesRepo.delete(id);
  revalidatePath("/", "layout");
  revalidatePath(`/p/${existing.slug}`);
  revalidatePath("/admin/pages");
}
