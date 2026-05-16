import { REVIEWS_FIXTURE } from "@/lib/db/fixtures/reviews";
import type { Review } from "@/types/domain";

export interface ReviewListOptions {
  limit?: number;
}

export interface ReviewsRepo {
  listFeatured(options?: ReviewListOptions): Promise<Review[]>;
  listByProduct(productId: string, options?: ReviewListOptions): Promise<Review[]>;
}

function newestFirst(a: Review, b: Review): number {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}

function applyLimit<T>(items: T[], options?: ReviewListOptions): T[] {
  return options?.limit ? items.slice(0, options.limit) : items;
}

export const reviewsRepo: ReviewsRepo = {
  async listFeatured(options) {
    const items = REVIEWS_FIXTURE.slice().sort(newestFirst);
    return applyLimit(items, options);
  },

  async listByProduct(productId, options) {
    const items = REVIEWS_FIXTURE.filter((r) => r.productId === productId)
      .slice()
      .sort(newestFirst);
    return applyLimit(items, options);
  },
};
