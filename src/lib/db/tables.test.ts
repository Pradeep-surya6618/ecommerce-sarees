import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { DDB_TABLE_PREFIX: "dev_" } }));

describe("tableName", () => {
  it("prefixes the logical name", async () => {
    const { tableName, TABLES } = await import("./tables");
    expect(tableName(TABLES.Users)).toBe("dev_Users");
    expect(tableName(TABLES.Orders)).toBe("dev_Orders");
  });

  it("exposes every entity from the spec", async () => {
    const { TABLES } = await import("./tables");
    const expected = ["Users", "Categories", "Products", "Carts", "Orders", "Ephemeral", "Content"];
    for (const name of expected) {
      expect(TABLES[name as keyof typeof TABLES]).toBe(name);
    }
  });
});
