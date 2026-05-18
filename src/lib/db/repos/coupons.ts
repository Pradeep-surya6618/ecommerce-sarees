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

declare global {
  var __mockCoupons: Map<string, Coupon> | undefined;
}

function getStore(): Map<string, Coupon> {
  if (!globalThis.__mockCoupons) {
    globalThis.__mockCoupons = new Map<string, Coupon>();
  }
  return globalThis.__mockCoupons;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normaliseCode(code: string): string {
  return code.trim().toUpperCase();
}

export const couponsRepo: CouponsRepo = {
  async listAll() {
    return [...getStore().values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async getByCode(code) {
    return getStore().get(normaliseCode(code)) ?? null;
  },

  async create(input) {
    const store = getStore();
    const code = normaliseCode(input.code);
    if (store.has(code)) {
      throw new Error(`Coupon with code "${code}" already exists.`);
    }
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
    store.set(code, coupon);
    return coupon;
  },

  async update(code, input) {
    const store = getStore();
    const normCode = normaliseCode(code);
    const coupon = store.get(normCode);
    if (!coupon) return null;
    Object.assign(coupon, input, { updatedAt: nowIso() });
    return coupon;
  },

  async delete(code) {
    getStore().delete(normaliseCode(code));
  },
};

export function __resetCouponsRepo(): void {
  globalThis.__mockCoupons = undefined;
}
