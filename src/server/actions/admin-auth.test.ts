import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPasswordStub } from "@/lib/auth/passwords";
import { __resetSessionsRepo } from "@/lib/db/repos/sessions";
import { __resetUsersRepo, usersRepo } from "@/lib/db/repos/users";
import { adminLoginAction } from "./admin-auth";

const redirectMock = vi.hoisted(() =>
  vi.fn((_: string) => {
    throw new Error("NEXT_REDIRECT");
  }),
);

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));

vi.mock("@/lib/auth/session-cookie", () => ({
  SESSION_COOKIE_NAME: "session_id",
  getSessionCookie: vi.fn(async () => null),
  setSessionCookie: vi.fn(async () => {}),
  clearSessionCookie: vi.fn(async () => {}),
}));

describe("adminLoginAction", () => {
  beforeEach(() => {
    __resetUsersRepo();
    __resetSessionsRepo();
    redirectMock.mockClear();
  });

  it("success: admin user is authenticated and redirected to /admin/dashboard", async () => {
    const user = await usersRepo.create({
      email: "admin@example.com",
      fullName: "Demo Admin",
      passwordHash: await hashPasswordStub("AdminDemo!23"),
    });
    await usersRepo.markEmailVerified(user.id);
    await usersRepo.promoteToAdmin(user.id);

    await expect(
      adminLoginAction({ email: "admin@example.com", password: "AdminDemo!23" }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    expect(redirectMock).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("wrong password: throws 'Email or password is incorrect'", async () => {
    const user = await usersRepo.create({
      email: "admin2@example.com",
      fullName: "Admin Two",
      passwordHash: await hashPasswordStub("CorrectPass!1"),
    });
    await usersRepo.markEmailVerified(user.id);
    await usersRepo.promoteToAdmin(user.id);

    await expect(
      adminLoginAction({ email: "admin2@example.com", password: "WrongPass!1" }),
    ).rejects.toThrow(/Email or password is incorrect/);
  });

  it("role rejection: customer cannot log in to admin", async () => {
    const user = await usersRepo.create({
      email: "customer@example.com",
      fullName: "Regular Customer",
      passwordHash: await hashPasswordStub("Hunter22!"),
    });
    await usersRepo.markEmailVerified(user.id);
    // role stays "customer" by default

    await expect(
      adminLoginAction({ email: "customer@example.com", password: "Hunter22!" }),
    ).rejects.toThrow(/does not have admin access/);
  });
});
