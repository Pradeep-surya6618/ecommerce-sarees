// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { NODE_ENV: "test", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },
}));

describe("GET /api/health", () => {
  it("returns 200 with status=ok and a timestamp", async () => {
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; timestamp: string };
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(Number.isFinite(Date.parse(body.timestamp))).toBe(true);
  });
});
