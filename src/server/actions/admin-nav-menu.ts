"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { navMenuRepo } from "@/lib/db/repos/nav-menu";
import type { NavMenuItemInput } from "@/types/domain";

export type NavMenuActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

function normalize(input: NavMenuItemInput): NavMenuItemInput {
  return {
    label: input.label.trim(),
    kind: input.kind,
    categorySlug: input.kind === "category" ? (input.categorySlug ?? "").trim() || null : null,
    href: input.kind === "custom-link" ? (input.href ?? "").trim() || null : null,
    parentId: input.parentId,
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    visible: !!input.visible,
  };
}

function validate(input: NavMenuItemInput): string | null {
  if (!input.label) return "Label is required.";
  if (input.kind === "category" && !input.categorySlug) {
    return "Pick a category for category-kind items.";
  }
  if (input.kind === "custom-link" && !input.href) {
    return "Enter a URL for custom-link items.";
  }
  return null;
}

export async function createNavMenuItemAction(
  input: NavMenuItemInput,
): Promise<NavMenuActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const data = normalize(input);
  const validationError = validate(data);
  if (validationError) return { ok: false, error: validationError };
  try {
    const item = await navMenuRepo.create(data);
    revalidatePath("/", "layout");
    revalidatePath("/admin/navigation");
    return { ok: true, id: item.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create nav item.";
    return { ok: false, error: message };
  }
}

export async function updateNavMenuItemAction(
  id: string,
  input: NavMenuItemInput,
): Promise<NavMenuActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const data = normalize(input);
  const validationError = validate(data);
  if (validationError) return { ok: false, error: validationError };
  try {
    const updated = await navMenuRepo.update(id, data);
    if (!updated) return { ok: false, error: "Nav item not found." };
    revalidatePath("/", "layout");
    revalidatePath("/admin/navigation");
    revalidatePath(`/admin/navigation/${id}`);
    return { ok: true, id: updated.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update nav item.";
    return { ok: false, error: message };
  }
}

export async function deleteNavMenuItemAction(id: string): Promise<NavMenuActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    await navMenuRepo.delete(id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/navigation");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete nav item.";
    return { ok: false, error: message };
  }
}
