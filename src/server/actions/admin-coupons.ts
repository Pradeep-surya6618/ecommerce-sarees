"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { couponsRepo } from "@/lib/db/repos/coupons";
import type { CouponStatus, CouponType } from "@/types/domain";

export type CouponActionResult = { ok: true; code?: string } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

export interface CreateCouponInput {
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
}

export async function createCouponAction(input: CreateCouponInput): Promise<CouponActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const coupon = await couponsRepo.create(input);
    revalidatePath("/admin/coupons");
    return { ok: true, code: coupon.code };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create coupon.";
    return { ok: false, error: message };
  }
}

export async function updateCouponAction(
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
): Promise<CouponActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const updated = await couponsRepo.update(code, input);
    if (!updated) return { ok: false, error: "Coupon not found." };
    revalidatePath(`/admin/coupons/${updated.code}`);
    revalidatePath("/admin/coupons");
    return { ok: true, code: updated.code };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update coupon.";
    return { ok: false, error: message };
  }
}

export async function deleteCouponAction(code: string): Promise<CouponActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    await couponsRepo.delete(code);
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete coupon.";
    return { ok: false, error: message };
  }
}
