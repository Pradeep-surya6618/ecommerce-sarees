"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { couponsRepo } from "@/lib/db/repos/coupons";
import type { CouponStatus, CouponType } from "@/types/domain";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    throw new Error("Admin access required.");
  }
  return user;
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

export async function createCouponAction(input: CreateCouponInput): Promise<void> {
  await requireAdmin();
  const coupon = await couponsRepo.create(input);
  revalidatePath("/admin/coupons");
  redirect(`/admin/coupons/${coupon.code}`);
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
): Promise<void> {
  await requireAdmin();
  await couponsRepo.update(code, input);
  revalidatePath(`/admin/coupons/${code.toUpperCase()}`);
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(code: string): Promise<void> {
  await requireAdmin();
  await couponsRepo.delete(code);
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}
