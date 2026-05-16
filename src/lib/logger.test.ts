import { describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger";

vi.mock("@/lib/env", () => ({ env: { LOG_LEVEL: "info" } }));

describe("createLogger", () => {
  it("returns a pino logger with the configured level and bindings", () => {
    const logger = createLogger({ level: "warn", service: "test-service" });
    expect(logger.level).toBe("warn");
    expect(logger.bindings()).toMatchObject({ service: "test-service" });
  });

  it("child loggers inherit bindings", () => {
    const logger = createLogger({ level: "info", service: "parent" });
    const child = logger.child({ requestId: "abc" });
    expect(child.bindings()).toMatchObject({ service: "parent", requestId: "abc" });
  });
});
