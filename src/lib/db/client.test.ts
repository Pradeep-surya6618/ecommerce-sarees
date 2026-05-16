import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    AWS_REGION: "ap-south-1",
    AWS_ACCESS_KEY_ID: "AKIA000000000000",
    AWS_SECRET_ACCESS_KEY: "secret-secret-secret-secret-secret",
  },
}));

describe("ddb client", () => {
  it("returns the same DocumentClient on repeat calls (singleton)", async () => {
    const { getDdbDoc } = await import("./client");
    const a = getDdbDoc();
    const b = getDdbDoc();
    expect(a).toBe(b);
  });

  it("exposes the underlying low-level client too", async () => {
    const { getDdbRaw } = await import("./client");
    const raw = getDdbRaw();
    expect(typeof raw.send).toBe("function");
  });
});
