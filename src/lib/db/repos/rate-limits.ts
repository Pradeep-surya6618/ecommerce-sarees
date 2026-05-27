import { createHash } from "node:crypto";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import { env } from "@/lib/env";

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets — present whether allowed or not. */
  retryAfterSeconds: number;
  /** How many hits are currently recorded in the window. */
  count: number;
  /** The cap — useful for messages like "5 of 5 attempts used". */
  limit: number;
}

export interface RateLimitsRepo {
  /**
   * Atomically increments a bucket's counter and reports whether the call
   * should proceed. Implements a fixed-window limiter: the first hit in a
   * fresh window sets the TTL, subsequent hits in the same window just bump
   * the counter, and once `count > max` the bucket replies `allowed: false`.
   *
   * Buckets are scoped strings — callers pick the shape (e.g. "login:ip:1.2.3.4"
   * or "signup:email:foo@bar.com"). The stored row is keyed by a salted SHA-256
   * of the bucket so raw PII (IPs, emails) never lands in DynamoDB.
   */
  checkAndIncrement(bucket: string, max: number, windowSeconds: number): Promise<RateLimitResult>;
}

function table(): string {
  return tableName(TABLES.Ephemeral);
}

// Hash the bucket key with the project's RATE_LIMIT_SALT so DDB never holds
// raw IPs or emails. TTL evicts the row shortly after the window closes
// anyway, but defence in depth doesn't hurt.
function bucketPk(bucket: string): string {
  const h = createHash("sha256")
    .update(env.RATE_LIMIT_SALT + ":" + bucket)
    .digest("hex")
    .slice(0, 24);
  return `RL#${h}`;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export const rateLimitsRepo: RateLimitsRepo = {
  async checkAndIncrement(bucket, max, windowSeconds) {
    const pk = bucketPk(bucket);
    const ddb = getDdbDoc();
    const now = nowSeconds();

    // Step 1 — peek at the current state to decide whether we're inside an
    // existing window or starting a fresh one. UpdateCommand below handles
    // the increment atomically; this Get just tells us which branch to take.
    const existing = await ddb.send(
      new GetCommand({
        TableName: table(),
        Key: { pk, sk: "META" },
      }),
    );

    const row = existing.Item as
      | { count?: number; expiresAt?: number; windowStartedAt?: number }
      | undefined;
    const inActiveWindow = row && typeof row.expiresAt === "number" && row.expiresAt > now;

    if (!inActiveWindow) {
      // Fresh window — set count=1, TTL=now+windowSeconds.
      const expiresAt = now + windowSeconds;
      await ddb.send(
        new UpdateCommand({
          TableName: table(),
          Key: { pk, sk: "META" },
          UpdateExpression: "SET #c = :one, expiresAt = :exp, windowStartedAt = :start",
          ExpressionAttributeNames: { "#c": "count" },
          ExpressionAttributeValues: {
            ":one": 1,
            ":exp": expiresAt,
            ":start": now,
          },
        }),
      );
      return { allowed: true, retryAfterSeconds: windowSeconds, count: 1, limit: max };
    }

    const currentCount = row?.count ?? 0;
    const expiresAt = row?.expiresAt ?? now;
    const retryAfterSeconds = Math.max(0, expiresAt - now);

    if (currentCount >= max) {
      // Already at or past the limit — don't increment further.
      return { allowed: false, retryAfterSeconds, count: currentCount, limit: max };
    }

    // Atomically increment, but only if still under the limit. The condition
    // protects against a concurrent request slipping us over the cap.
    try {
      const res = await ddb.send(
        new UpdateCommand({
          TableName: table(),
          Key: { pk, sk: "META" },
          UpdateExpression: "SET #c = if_not_exists(#c, :zero) + :one",
          ConditionExpression: "attribute_not_exists(#c) OR #c < :max",
          ExpressionAttributeNames: { "#c": "count" },
          ExpressionAttributeValues: { ":one": 1, ":zero": 0, ":max": max },
          ReturnValues: "ALL_NEW",
        }),
      );
      const attrs = (res.Attributes ?? {}) as { count?: number };
      const nextCount = attrs.count ?? currentCount + 1;
      return {
        allowed: true,
        retryAfterSeconds,
        count: nextCount,
        limit: max,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ConditionalCheckFailed")) {
        // A concurrent request pushed us over the limit between our Get
        // and Update. Surface as throttled.
        return { allowed: false, retryAfterSeconds, count: max, limit: max };
      }
      throw err;
    }
  },
};
