import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { Coupon, CouponStatus, CouponType } from "@/types/domain";

export interface CouponsRepo {
  listAll(): Promise<Coupon[]>;
  getByCode(code: string): Promise<Coupon | null>;
  create(input: {
    code: string;
    description?: string;
    type: CouponType;
    value: number;
    minOrderPaise?: number;
    maxDiscountPaise?: number;
    maxUses?: number;
    validFrom: string;
    validTo: string;
    status: CouponStatus;
  }): Promise<Coupon>;
  update(
    code: string,
    input: Partial<{
      description: string;
      type: CouponType;
      value: number;
      minOrderPaise: number;
      maxDiscountPaise: number;
      maxUses: number;
      validFrom: string;
      validTo: string;
      status: CouponStatus;
    }>,
  ): Promise<Coupon | null>;
  delete(code: string): Promise<void>;
}

// Coupons live in the shared Content table.
//   PK = "COUPON#<CODE>"
//   SK = "META"
//   GSI1: gsi1pk="COUPON#STATUS#<status>", gsi1sk=<validTo>  (admin status views)
const PK_PREFIX = "COUPON#";

function couponPk(code: string): string {
  return `${PK_PREFIX}${normaliseCode(code)}`;
}

function couponGsi1Pk(status: CouponStatus): string {
  return `COUPON#STATUS#${status}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normaliseCode(code: string): string {
  return code.trim().toUpperCase();
}

function table(): string {
  return tableName(TABLES.Content);
}

interface CouponItem extends Coupon {
  pk: string;
  sk: string;
  gsi1pk: string;
  gsi1sk: string;
  entity: "coupon";
}

function toItem(coupon: Coupon): CouponItem {
  return {
    ...coupon,
    pk: couponPk(coupon.code),
    sk: "META",
    gsi1pk: couponGsi1Pk(coupon.status),
    gsi1sk: coupon.validTo,
    entity: "coupon",
  };
}

function fromItem(item: Record<string, unknown> | undefined): Coupon | null {
  if (!item) return null;
  if ((item as { entity?: string }).entity !== "coupon") return null;
  const { pk: _pk, sk: _sk, gsi1pk: _gp, gsi1sk: _gs, entity: _e, ...rest } = item as CouponItem;
  return rest as Coupon;
}

export const couponsRepo: CouponsRepo = {
  async listAll() {
    const out: Coupon[] = [];
    let lastKey: Record<string, unknown> | undefined;
    do {
      const res = await getDdbDoc().send(
        new ScanCommand({
          TableName: table(),
          FilterExpression: "entity = :e",
          ExpressionAttributeValues: { ":e": "coupon" },
          ExclusiveStartKey: lastKey,
        }),
      );
      for (const item of res.Items ?? []) {
        const coupon = fromItem(item);
        if (coupon) out.push(coupon);
      }
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async getByCode(code) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { pk: couponPk(code), sk: "META" },
      }),
    );
    return fromItem(res.Item);
  },

  async create(input) {
    const code = normaliseCode(input.code);
    const now = nowIso();
    const coupon: Coupon = {
      code,
      description: input.description,
      type: input.type,
      value: input.value,
      minOrderPaise: input.minOrderPaise,
      maxDiscountPaise: input.maxDiscountPaise,
      maxUses: input.maxUses,
      usedCount: 0,
      validFrom: input.validFrom,
      validTo: input.validTo,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await getDdbDoc().send(
        new PutCommand({
          TableName: table(),
          Item: toItem(coupon),
          ConditionExpression: "attribute_not_exists(pk)",
        }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ConditionalCheckFailed")) {
        throw new Error(`Coupon with code "${code}" already exists.`);
      }
      throw err;
    }
    return coupon;
  },

  async update(code, input) {
    const existing = await couponsRepo.getByCode(code);
    if (!existing) return null;
    const updated: Coupon = { ...existing, ...input, updatedAt: nowIso() };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(updated),
      }),
    );
    return updated;
  },

  async delete(code) {
    await getDdbDoc().send(
      new DeleteCommand({
        TableName: table(),
        Key: { pk: couponPk(code), sk: "META" },
      }),
    );
  },
};
