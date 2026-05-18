import { beforeEach, describe, expect, it } from "vitest";
import { __resetUsersRepo, usersRepo } from "./users";

describe("usersRepo (mock)", () => {
  beforeEach(() => __resetUsersRepo());

  it("creates a user and finds it by email (case-insensitive)", async () => {
    const created = await usersRepo.create({
      email: "Aishwarya@example.com",
      fullName: "Aishwarya R.",
      passwordHash: "hash:secret",
    });
    expect(created.id).toMatch(/^usr_/);
    expect(created.email).toBe("aishwarya@example.com");
    expect(created.role).toBe("customer");
    expect(created.emailVerified).toBe(false);

    const found = await usersRepo.findByEmail("AISHWARYA@example.com");
    expect(found?.id).toBe(created.id);
  });

  it("throws when creating with a duplicate email", async () => {
    await usersRepo.create({
      email: "a@example.com",
      fullName: "A",
      passwordHash: "h",
    });
    await expect(
      usersRepo.create({ email: "a@example.com", fullName: "A2", passwordHash: "h2" }),
    ).rejects.toThrow(/already/i);
  });

  it("marks email verified", async () => {
    const user = await usersRepo.create({
      email: "v@example.com",
      fullName: "V",
      passwordHash: "h",
    });
    const updated = await usersRepo.markEmailVerified(user.id);
    expect(updated?.emailVerified).toBe(true);
  });

  it("updates password hash", async () => {
    const user = await usersRepo.create({
      email: "p@example.com",
      fullName: "P",
      passwordHash: "old",
    });
    const updated = await usersRepo.updatePasswordHash(user.id, "new");
    expect(updated?.passwordHash).toBe("new");
  });
});
