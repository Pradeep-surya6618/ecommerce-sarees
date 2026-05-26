"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { productsRepo } from "@/lib/db/repos/products";
import type { ProductDraft } from "@/types/domain";

export type ProductActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

export async function createProductAction(input: ProductDraft): Promise<ProductActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const product = await productsRepo.create(input);
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
    return { ok: true, id: product.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create product.";
    return { ok: false, error: message };
  }
}

export async function updateProductAction(
  id: string,
  input: Partial<ProductDraft>,
): Promise<ProductActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const updated = await productsRepo.update(id, input);
    if (!updated) {
      return { ok: false, error: "Product not found." };
    }
    revalidatePath("/", "layout");
    revalidatePath(`/admin/products/${id}`);
    return { ok: true, id: updated.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update product.";
    return { ok: false, error: message };
  }
}

export async function archiveProductAction(id: string): Promise<ProductActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const archived = await productsRepo.archive(id);
    if (!archived) {
      return { ok: false, error: "Product not found." };
    }
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
    return { ok: true, id: archived.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to archive product.";
    return { ok: false, error: message };
  }
}
