"use server";

import { revalidatePath } from "next/cache";
import { MAX_NAV_ITEMS } from "@/lib/admin/nav-limits";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { navMenuRepo } from "@/lib/db/repos/nav-menu";
import type { NavMenuItemInput } from "@/types/domain";

export type NavMenuActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentAdminUser();
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

  // The cap applies only to TOP-LEVEL items (those shown directly in the
  // header). Children sit inside a parent's dropdown and have no limit.
  const isTopLevel = !data.parentId;
  if (isTopLevel) {
    const existing = await navMenuRepo.list();
    const topLevelCount = existing.filter((i) => i.parentId === null).length;
    if (topLevelCount >= MAX_NAV_ITEMS) {
      return {
        ok: false,
        error: `Top-level navigation is capped at ${MAX_NAV_ITEMS} items. Delete or hide an existing top-level item first, or add this one as a child under another item.`,
      };
    }
  }

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
    const existing = await navMenuRepo.getById(id);
    if (!existing) return { ok: false, error: "Nav item not found." };

    // System items: admin can rename / reorder / hide, but the route is
    // wired to a storefront page so we hard-preserve kind / href / categorySlug
    // / parentId from the existing record regardless of what was submitted.
    const toUpdate = existing.isSystem
      ? {
          ...data,
          kind: existing.kind,
          href: existing.href,
          categorySlug: existing.categorySlug,
          parentId: existing.parentId,
        }
      : data;

    // If a child is being promoted to top-level, enforce the same cap.
    const wasTopLevel = existing.parentId === null;
    const willBeTopLevel = !toUpdate.parentId;
    if (!wasTopLevel && willBeTopLevel) {
      const all = await navMenuRepo.list();
      const topLevelCount = all.filter((i) => i.parentId === null).length;
      if (topLevelCount >= MAX_NAV_ITEMS) {
        return {
          ok: false,
          error: `Top-level navigation is capped at ${MAX_NAV_ITEMS} items. Keep this item as a child or remove a top-level item first.`,
        };
      }
    }

    const updated = await navMenuRepo.update(id, toUpdate);
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
    const existing = await navMenuRepo.getById(id);
    if (existing?.isSystem) {
      return {
        ok: false,
        error: "System nav items can't be deleted. Hide them instead.",
      };
    }
    await navMenuRepo.delete(id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/navigation");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete nav item.";
    return { ok: false, error: message };
  }
}
