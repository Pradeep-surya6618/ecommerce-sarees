import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { Review } from "@/types/domain";

export interface ReviewListOptions {
  limit?: number;
}

export interface UpsertReviewInput {
  productId: string;
  userId: string;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  body: string;
  verifiedPurchase: boolean;
}

export interface RatingAggregate {
  sum: number;
  count: number;
}

export interface ReviewsRepo {
  listByProduct(productId: string, options?: ReviewListOptions): Promise<Review[]>;
  getByUserAndProduct(productId: string, userId: string): Promise<Review | null>;
  upsert(input: UpsertReviewInput): Promise<Review>;
  deleteOne(productId: string, userId: string): Promise<void>;
  aggregateForProduct(productId: string): Promise<RatingAggregate>;
  // Homepage "What customers say" — top reviews across all products.
  listFeatured(options?: ReviewListOptions): Promise<Review[]>;
  // Admin moderation — every review, newest first.
  listAll(): Promise<Review[]>;
}

// Reviews live in the Content table.
//   PK = "REVIEW#<productId>"
//   SK = "USER#<userId>"   → one review per customer per product (upsert)
//   entity = "review"
// Per-product reads are a single Query on the PK. Cross-product reads
// (homepage featured, admin moderation) Scan with an entity filter — fine at
// the review volumes this store runs at.

function reviewPk(productId: string): string {
  return `REVIEW#${productId}`;
}

function reviewSk(userId: string): string {
  return `USER#${userId}`;
}

function table(): string {
  return tableName(TABLES.Content);
}

function nowIso(): string {
  return new Date().toISOString();
}

interface ReviewItem extends Review {
  pk: string;
  sk: string;
  entity: "review";
}

function toItem(review: Review): ReviewItem {
  return {
    ...review,
    pk: reviewPk(review.productId ?? "unknown"),
    sk: reviewSk(review.userId ?? "unknown"),
    entity: "review",
  };
}

function fromItem(item: Record<string, unknown> | undefined): Review | null {
  if (!item) return null;
  if ((item as { entity?: string }).entity !== "review") return null;
  const { pk: _pk, sk: _sk, entity: _e, ...rest } = item as ReviewItem;
  return rest as Review;
}

function sortNewestFirst(a: Review, b: Review): number {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}

// Featured ordering: highest rating first, then most recent. Gives the
// homepage a flattering-but-fresh selection.
function sortFeatured(a: Review, b: Review): number {
  if (b.rating !== a.rating) return b.rating - a.rating;
  return sortNewestFirst(a, b);
}

async function scanReviews(): Promise<Review[]> {
  const out: Review[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await getDdbDoc().send(
      new ScanCommand({
        TableName: table(),
        FilterExpression: "entity = :e",
        ExpressionAttributeValues: { ":e": "review" },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of res.Items ?? []) {
      const review = fromItem(item);
      if (review) out.push(review);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

export const reviewsRepo: ReviewsRepo = {
  async listByProduct(productId, options) {
    const res = await getDdbDoc().send(
      new QueryCommand({
        TableName: table(),
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": reviewPk(productId) },
      }),
    );
    const reviews = (res.Items ?? [])
      .map(fromItem)
      .filter((r): r is Review => r !== null)
      .sort(sortNewestFirst);
    return options?.limit ? reviews.slice(0, options.limit) : reviews;
  },

  async getByUserAndProduct(productId, userId) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { pk: reviewPk(productId), sk: reviewSk(userId) },
      }),
    );
    return fromItem(res.Item);
  },

  async upsert(input) {
    // Preserve the original id + createdAt when a customer edits their review.
    const existing = await reviewsRepo.getByUserAndProduct(input.productId, input.userId);
    const now = nowIso();
    const review: Review = {
      id: existing?.id ?? `rev_${nanoid(12)}`,
      productId: input.productId,
      userId: input.userId,
      authorName: input.authorName,
      rating: input.rating,
      title: input.title,
      body: input.body,
      verifiedPurchase: input.verifiedPurchase,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    // DynamoDB rejects `undefined` attribute values — drop title when absent.
    const item = toItem(review);
    if (review.title === undefined) delete (item as { title?: string }).title;
    await getDdbDoc().send(new PutCommand({ TableName: table(), Item: item }));
    return review;
  },

  async deleteOne(productId, userId) {
    await getDdbDoc().send(
      new DeleteCommand({
        TableName: table(),
        Key: { pk: reviewPk(productId), sk: reviewSk(userId) },
      }),
    );
  },

  async aggregateForProduct(productId) {
    const reviews = await reviewsRepo.listByProduct(productId);
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { sum, count: reviews.length };
  },

  async listFeatured(options) {
    const reviews = (await scanReviews())
      // Only show reasonably positive reviews on the marketing homepage.
      .filter((r) => r.rating >= 4 && r.body.trim().length > 0)
      .sort(sortFeatured);
    return options?.limit ? reviews.slice(0, options.limit) : reviews;
  },

  async listAll() {
    return (await scanReviews()).sort(sortNewestFirst);
  },
};
