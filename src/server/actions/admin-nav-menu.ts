"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { navMenuRepo } from "@/lib/db/repos/nav-menu";
import type { NavMenuItemInput } from "@/types/domain";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    throw new Error("Admin access required.");
  }
  return user;
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

function validate(input: NavMenuItemInput): void {
  if (!input.label) throw new Error("Label is required.");
  if (input.kind === "category" && !input.categorySlug) {
    throw new Error("Pick a category for category-kind items.");
  }
  if (input.kind === "custom-link" && !input.href) {
    throw new Error("Enter a URL for custom-link items.");
  }
}

export async function createNavMenuItemAction(input: NavMenuItemInput): Promise<void> {
  await requireAdmin();
  const data = normalize(input);
  validate(data);
  const item = await navMenuRepo.create(data);
  revalidatePath("/", "layout");
  revalidatePath("/admin/navigation");
  redirect(`/admin/navigation/${item.id}`);
}

export async function updateNavMenuItemAction(id: string, input: NavMenuItemInput): Promise<void> {
  await requireAdmin();
  const data = normalize(input);
  validate(data);
  await navMenuRepo.update(id, data);
  revalidatePath("/", "layout");
  revalidatePath("/admin/navigation");
  revalidatePath(`/admin/navigation/${id}`);
}

export async function deleteNavMenuItemAction(id: string): Promise<void> {
  await requireAdmin();
  await navMenuRepo.delete(id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/navigation");
  redirect("/admin/navigation");
}
