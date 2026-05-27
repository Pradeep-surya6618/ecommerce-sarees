"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { productsRepo } from "@/lib/db/repos/products";
import { reviewsRepo } from "@/lib/db/repos/reviews";

export type AdminReviewActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

async function recomputeProductRating(productId: string): Promise<void> {
  const { sum, count } = await reviewsRepo.aggregateForProduct(productId);
  try {
    await productsRepo.updateRatingAggregate(productId, sum, count);
  } catch {
    // Product gone — nothing to aggregate onto.
  }
}

// Remove a review (spam / abuse). Keyed by productId + userId since that's the
// review's composite key. Recomputes the product aggregate afterwards.
export async function adminDeleteReviewAction(
  productId: string,
  userId: string,
): Promise<AdminReviewActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    await reviewsRepo.deleteOne(productId, userId);
    await recomputeProductRating(productId);
    const product = await productsRepo.getById(productId);
    if (product) revalidatePath(`/product/${product.slug}`);
    revalidatePath("/admin/reviews");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't delete the review." };
  }
}
