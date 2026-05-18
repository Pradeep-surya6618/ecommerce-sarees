import { beforeEach, describe, expect, it } from "vitest";
import { __resetSessionsRepo, sessionsRepo } from "./sessions";

describe("sessionsRepo (mock)", () => {
  beforeEach(() => __resetSessionsRepo());

  it("creates a session and retrieves it by id", async () => {
    const s = await sessionsRepo.create("usr_x");
    expect(s.id).toMatch(/^sess_/);
    expect(s.userId).toBe("usr_x");
    const found = await sessionsRepo.findById(s.id);
    expect(found?.id).toBe(s.id);
  });

  it("deletes a session", async () => {
    const s = await sessionsRepo.create("usr_x");
    await sessionsRepo.deleteById(s.id);
    expect(await sessionsRepo.findById(s.id)).toBeNull();
  });

  it("treats expired sessions as not found", async () => {
    const s = await sessionsRepo.create("usr_x", { ttlSeconds: -10 });
    expect(await sessionsRepo.findById(s.id)).toBeNull();
  });
});
