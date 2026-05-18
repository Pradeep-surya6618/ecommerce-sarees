import { beforeEach, describe, expect, it } from "vitest";
import { __resetCouponsRepo, couponsRepo } from "./coupons";

const sampleInput = {
  code: "SAVE20",
  description: "20% off your order",
  type: "percent" as const,
  value: 20,
  validFrom: "2026-01-01T00:00:00.000Z",
  validTo: "2026-12-31T23:59:59.000Z",
  status: "active" as const,
};

describe("couponsRepo (mock)", () => {
  beforeEach(() => __resetCouponsRepo());

  it("creates a coupon and retrieves it by code", async () => {
    const coupon = await couponsRepo.create(sampleInput);
    expect(coupon.code).toBe("SAVE20");
    expect(coupon.usedCount).toBe(0);
    expect(coupon.type).toBe("percent");
    const fetched = await couponsRepo.getByCode("SAVE20");
    expect(fetched?.code).toBe("SAVE20");
  });

  it("normalises lowercase code to uppercase on create and getByCode", async () => {
    const coupon = await couponsRepo.create({ ...sampleInput, code: "save20" });
    expect(coupon.code).toBe("SAVE20");
    const fetched = await couponsRepo.getByCode("save20");
    expect(fetched?.code).toBe("SAVE20");
    const fetchedUpper = await couponsRepo.getByCode("SAVE20");
    expect(fetchedUpper?.code).toBe("SAVE20");
  });

  it("throws when creating a coupon with a duplicate code", async () => {
    await couponsRepo.create(sampleInput);
    await expect(couponsRepo.create(sampleInput)).rejects.toThrow(/already exists/i);
  });

  it("duplicate code check is case-insensitive", async () => {
    await couponsRepo.create({ ...sampleInput, code: "DUPE10" });
    await expect(couponsRepo.create({ ...sampleInput, code: "dupe10" })).rejects.toThrow(
      /already exists/i,
    );
  });

  it("update changes coupon fields", async () => {
    const coupon = await couponsRepo.create(sampleInput);
    const updated = await couponsRepo.update(coupon.code, { value: 30, status: "paused" });
    expect(updated?.value).toBe(30);
    expect(updated?.status).toBe("paused");
    const fetched = await couponsRepo.getByCode("SAVE20");
    expect(fetched?.value).toBe(30);
  });

  it("delete removes the coupon", async () => {
    await couponsRepo.create(sampleInput);
    await couponsRepo.delete("SAVE20");
    const fetched = await couponsRepo.getByCode("SAVE20");
    expect(fetched).toBeNull();
  });

  it("listAll returns coupons sorted by createdAt desc", async () => {
    await couponsRepo.create({ ...sampleInput, code: "FIRST" });
    await new Promise((r) => setTimeout(r, 5));
    await couponsRepo.create({ ...sampleInput, code: "SECOND" });
    const list = await couponsRepo.listAll();
    expect(list).toHaveLength(2);
    expect(list[0]!.code).toBe("SECOND");
    expect(list[1]!.code).toBe("FIRST");
  });
});
