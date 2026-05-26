"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { categoriesRepo, type CategoryDraft } from "@/lib/db/repos/categories";

export type CategoryActionResult = { ok: true; slug?: string } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

export async function createCategoryAction(input: CategoryDraft): Promise<CategoryActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const category = await categoriesRepo.create(input);
    revalidatePath("/", "layout");
    revalidatePath("/admin/categories");
    return { ok: true, slug: category.slug };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create category.";
    return { ok: false, error: message };
  }
}

export async function updateCategoryAction(
  id: string,
  input: Partial<CategoryDraft>,
): Promise<CategoryActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const updated = await categoriesRepo.update(id, input);
    if (!updated) {
      return { ok: false, error: "Category not found." };
    }
    revalidatePath("/", "layout");
    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${updated.slug}`);
    return { ok: true, slug: updated.slug };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update category.";
    return { ok: false, error: message };
  }
}

export async function deleteCategoryAction(id: string): Promise<CategoryActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    await categoriesRepo.delete(id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete category.";
    return { ok: false, error: message };
  }
}
