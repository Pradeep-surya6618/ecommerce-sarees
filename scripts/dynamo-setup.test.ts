import { describe, expect, it, vi } from "vitest";
import { TABLE_SPECS } from "./dynamo-setup";

vi.mock("@/lib/env", () => ({
  env: {
    DDB_TABLE_PREFIX: "test_",
    AWS_REGION: "ap-south-1",
    AWS_ACCESS_KEY_ID: "x",
    AWS_SECRET_ACCESS_KEY: "x",
    LOG_LEVEL: "silent",
  },
}));

vi.mock("@/lib/db/client", () => ({
  getDdbRaw: vi.fn(),
}));

describe("TABLE_SPECS", () => {
  it("covers every entity in the design spec", () => {
    const names = TABLE_SPECS.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Users",
        "OtpCodes",
        "Sessions",
        "Categories",
        "Products",
        "Inventory",
        "Carts",
        "Addresses",
        "Orders",
        "Coupons",
        "Banners",
        "Reviews",
        "BlogPosts",
        "WebhookEvents",
        "AdminAuditLog",
        "Settings",
        "RateLimits",
      ]),
    );
  });

  it("declares every table with a primary key", () => {
    for (const spec of TABLE_SPECS) {
      expect(spec.hashKey, `${spec.name} missing hashKey`).toBeTruthy();
    }
  });

  it("enables TTL where the spec requires it", () => {
    const ttlExpected = ["OtpCodes", "Sessions", "Carts", "WebhookEvents", "RateLimits"];
    for (const name of ttlExpected) {
      const spec = TABLE_SPECS.find((t) => t.name === name);
      expect(spec?.ttlAttribute, `${name} should have a TTL attribute`).toBeTruthy();
    }
  });

  it("declares GSIs the access patterns require", () => {
    const users = TABLE_SPECS.find((t) => t.name === "Users");
    expect(users?.gsis?.map((g) => g.name)).toContain("EmailIndex");
    const products = TABLE_SPECS.find((t) => t.name === "Products");
    expect(products?.gsis?.map((g) => g.name)).toEqual(
      expect.arrayContaining(["SlugIndex", "CategoryStatusIndex"]),
    );
    const orders = TABLE_SPECS.find((t) => t.name === "Orders");
    expect(orders?.gsis?.map((g) => g.name)).toEqual(
      expect.arrayContaining(["UserCreatedIndex", "StatusCreatedIndex"]),
    );
  });
});
