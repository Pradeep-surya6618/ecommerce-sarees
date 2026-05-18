import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetCouponsRepo, couponsRepo } from "@/lib/db/repos/coupons";
import type { User } from "@/types/domain";
import { createCouponAction, deleteCouponAction, updateCouponAction } from "./admin-coupons";

const redirectMock = vi.hoisted(() =>
  vi.fn((_: string) => {
    throw new Error("NEXT_REDIRECT");
  }),
);

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));

const getCurrentUserMock = vi.hoisted(() =>
  vi.fn<() => Promise<Partial<User> | null>>(async () => null),
);
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: getCurrentUserMock }));

const adminUser: Partial<User> = {
  id: "usr_admin",
  role: "admin",
  email: "admin@example.com",
  fullName: "Demo Admin",
};

const baseInput = {
  code: "save20",
  type: "percent" as const,
  value: 20,
  validFrom: "2026-01-01",
  validTo: "2026-12-31",
  status: "active" as const,
};

describe("admin-coupons server actions", () => {
  beforeEach(() => {
    __resetCouponsRepo();
    redirectMock.mockClear();
    getCurrentUserMock.mockReset();
    getCurrentUserMock.mockResolvedValue(adminUser);
  });

  it("createCouponAction creates a coupon and redirects to the uppercased code URL", async () => {
    await expect(createCouponAction(baseInput)).rejects.toThrow(/NEXT_REDIRECT/);

    const created = await couponsRepo.getByCode("SAVE20");
    expect(created).not.toBeNull();
    expect(created?.code).toBe("SAVE20");
    expect(redirectMock).toHaveBeenCalledWith("/admin/coupons/SAVE20");
  });

  it("updateCouponAction updates coupon fields without redirecting", async () => {
    await couponsRepo.create(baseInput);

    await updateCouponAction("SAVE20", { value: 25 });

    const updated = await couponsRepo.getByCode("SAVE20");
    expect(updated?.value).toBe(25);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("deleteCouponAction deletes the coupon and redirects to the coupons list", async () => {
    await couponsRepo.create(baseInput);

    await expect(deleteCouponAction("SAVE20")).rejects.toThrow(/NEXT_REDIRECT/);

    const deleted = await couponsRepo.getByCode("SAVE20");
    expect(deleted).toBeNull();
    expect(redirectMock).toHaveBeenCalledWith("/admin/coupons");
  });
});
