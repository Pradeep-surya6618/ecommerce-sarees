"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { productsRepo } from "@/lib/db/repos/products";
import type { ProductDraft } from "@/types/domain";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    throw new Error("Admin access required.");
  }
  return user;
}

export async function createProductAction(input: ProductDraft): Promise<void> {
  await requireAdmin();
  const product = await productsRepo.create(input);
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProductAction(id: string, input: Partial<ProductDraft>): Promise<void> {
  await requireAdmin();
  await productsRepo.update(id, input);
  revalidatePath("/", "layout");
  revalidatePath(`/admin/products/${id}`);
}

export async function archiveProductAction(id: string): Promise<void> {
  await requireAdmin();
  await productsRepo.archive(id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
}
