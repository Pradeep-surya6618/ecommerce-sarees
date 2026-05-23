import type { Review } from "@/types/domain";

export interface ReviewListOptions {
  limit?: number;
}

export interface ReviewsRepo {
  listFeatured(options?: ReviewListOptions): Promise<Review[]>;
  listByProduct(productId: string, options?: ReviewListOptions): Promise<Review[]>;
}

// Reviews are not yet implemented against DynamoDB. They land in a later phase
// using the Content table with `REVIEW#<productId>` PK and per-review SK.
// Until then the storefront should render the empty state.
export const reviewsRepo: ReviewsRepo = {
  async listFeatured() {
    return [];
  },

  async listByProduct() {
    return [];
  },
};
