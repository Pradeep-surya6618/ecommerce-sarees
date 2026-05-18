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

  it("findOrCreateGoogle creates a verified Google user when none exists", async () => {
    const user = await usersRepo.findOrCreateGoogle({
      email: "priya@gmail.com",
      fullName: "Priya Sharma",
    });
    expect(user.id).toMatch(/^usr_/);
    expect(user.email).toBe("priya@gmail.com");
    expect(user.emailVerified).toBe(true);
    expect(user.provider).toBe("google");
    expect(user.passwordHash).toBe("");
  });

  it("findOrCreateGoogle returns the same user on repeat calls", async () => {
    const first = await usersRepo.findOrCreateGoogle({
      email: "anita@gmail.com",
      fullName: "Anita Iyer",
    });
    const second = await usersRepo.findOrCreateGoogle({
      email: "anita@gmail.com",
      fullName: "Anita Iyer",
    });
    expect(second.id).toBe(first.id);
  });

  it("promoteToAdmin flips the role to admin", async () => {
    const user = await usersRepo.create({
      email: "staff@example.com",
      fullName: "Staff Member",
      passwordHash: "h",
    });
    expect(user.role).toBe("customer");
    const promoted = await usersRepo.promoteToAdmin(user.id);
    expect(promoted?.role).toBe("admin");
    const fetched = await usersRepo.findById(user.id);
    expect(fetched?.role).toBe("admin");
  });

  it("listCustomers returns only customers and excludes admin/staff", async () => {
    await usersRepo.create({
      email: "c1@example.com",
      fullName: "Customer One",
      passwordHash: "h",
    });
    await usersRepo.create({
      email: "c2@example.com",
      fullName: "Customer Two",
      passwordHash: "h",
    });
    await usersRepo.create({
      email: "admin@example.com",
      fullName: "Admin User",
      passwordHash: "h",
      role: "admin",
    });
    const customers = await usersRepo.listCustomers();
    expect(customers).toHaveLength(2);
    expect(customers.every((u) => u.role === "customer")).toBe(true);
  });

  it("listCustomers filters by search (email and name, case-insensitive)", async () => {
    await usersRepo.create({
      email: "priya@example.com",
      fullName: "Priya Sharma",
      passwordHash: "h",
    });
    await usersRepo.create({
      email: "anita@example.com",
      fullName: "Anita Iyer",
      passwordHash: "h",
    });
    const byEmail = await usersRepo.listCustomers({ search: "PRIYA@" });
    expect(byEmail).toHaveLength(1);
    expect(byEmail[0]?.email).toBe("priya@example.com");
    const byName = await usersRepo.listCustomers({ search: "iyer" });
    expect(byName).toHaveLength(1);
    expect(byName[0]?.fullName).toBe("Anita Iyer");
  });

  it("blockUser and unblockUser flip the blocked flag", async () => {
    const user = await usersRepo.create({
      email: "block@example.com",
      fullName: "Block Test",
      passwordHash: "h",
    });
    expect(user.blocked).toBe(false);
    const blocked = await usersRepo.blockUser(user.id);
    expect(blocked?.blocked).toBe(true);
    const unblocked = await usersRepo.unblockUser(user.id);
    expect(unblocked?.blocked).toBe(false);
  });
});
