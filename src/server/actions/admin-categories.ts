"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { categoriesRepo, type CategoryDraft } from "@/lib/db/repos/categories";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    throw new Error("Admin access required.");
  }
  return user;
}

export async function createCategoryAction(input: CategoryDraft): Promise<void> {
  await requireAdmin();
  const category = await categoriesRepo.create(input);
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
  redirect(`/admin/categories/${category.slug}`);
}

export async function updateCategoryAction(
  id: string,
  input: Partial<CategoryDraft>,
): Promise<void> {
  await requireAdmin();
  await categoriesRepo.update(id, input);
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(id: string): Promise<void> {
  await requireAdmin();
  await categoriesRepo.delete(id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}
