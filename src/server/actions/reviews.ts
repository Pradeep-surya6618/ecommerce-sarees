"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ordersRepo } from "@/lib/db/repos/orders";
import { productsRepo } from "@/lib/db/repos/products";
import { reviewsRepo } from "@/lib/db/repos/reviews";

export type ReviewActionResult = { ok: true } | { ok: false; error: string };

export interface SubmitReviewInput {
  productId: string;
  rating: number;
  title?: string;
  body: string;
}

// Recompute the product's denormalised rating aggregate from its reviews.
// Called after every write so product cards and the detail summary stay
// consistent. Best-effort on the product update — a missing product (archived
// mid-review) shouldn't fail the customer's action.
async function recomputeProductRating(productId: string): Promise<void> {
  const { sum, count } = await reviewsRepo.aggregateForProduct(productId);
  try {
    await productsRepo.updateRatingAggregate(productId, sum, count);
  } catch {
    // Product row gone or conditional failed — nothing to aggregate onto.
  }
}

async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  const orders = await ordersRepo.listByUser(userId);
  return orders.some((o) => o.items.some((i) => i.productId === productId));
}

export async function submitReviewAction(input: SubmitReviewInput): Promise<ReviewActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to write a review." };

  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) {
    return { ok: false, error: "Please choose a rating from 1 to 5 stars." };
  }
  const body = input.body.trim();
  if (body.length < 10) {
    return { ok: false, error: "Tell us a little more — at least 10 characters." };
  }
  if (body.length > 2000) {
    return { ok: false, error: "Reviews are capped at 2000 characters." };
  }
  const title = input.title?.trim() || undefined;
  if (title && title.length > 120) {
    return { ok: false, error: "Title is capped at 120 characters." };
  }

  const product = await productsRepo.getById(input.productId);
  if (!product) return { ok: false, error: "Product not found." };

  try {
    const verifiedPurchase = await hasPurchased(user.id, input.productId);
    await reviewsRepo.upsert({
      productId: input.productId,
      userId: user.id,
      authorName: user.fullName,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      title,
      body,
      verifiedPurchase,
    });
    await recomputeProductRating(input.productId);
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't save your review." };
  }
}

export async function deleteMyReviewAction(productId: string): Promise<ReviewActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  try {
    await reviewsRepo.deleteOne(productId, user.id);
    await recomputeProductRating(productId);
    const product = await productsRepo.getById(productId);
    if (product) revalidatePath(`/product/${product.slug}`);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn't delete your review.",
    };
  }
}
