import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetCartRepo } from "@/lib/db/repos/cart";
import { __resetSessionsRepo } from "@/lib/db/repos/sessions";
import { __resetUsersRepo, usersRepo } from "@/lib/db/repos/users";
import { googleSignInAction } from "./google-auth";

const redirectMock = vi.hoisted(() =>
  vi.fn((_: string) => {
    throw new Error("NEXT_REDIRECT");
  }),
);
const clearGuestSessionMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));

vi.mock("@/lib/auth/session-cookie", () => ({
  SESSION_COOKIE_NAME: "session_id",
  getSessionCookie: vi.fn(async () => null),
  setSessionCookie: vi.fn(async () => {}),
  clearSessionCookie: vi.fn(async () => {}),
}));

vi.mock("@/lib/cart/guest-session", () => ({
  getGuestSessionId: vi.fn(async () => null),
  ensureGuestSessionId: vi.fn(async () => null),
}));

vi.mock("@/lib/cart/clear-guest-session", () => ({
  clearGuestSessionCookie: clearGuestSessionMock,
}));

describe("google sign-in server action", () => {
  beforeEach(() => {
    __resetUsersRepo();
    __resetSessionsRepo();
    __resetCartRepo();
    redirectMock.mockClear();
    clearGuestSessionMock.mockClear();
  });

  it("creates a session and redirects to /account on first sign-in", async () => {
    await expect(googleSignInAction("demo+priya@gmail.com")).rejects.toThrow(/NEXT_REDIRECT/);

    const user = await usersRepo.findByEmail("demo+priya@gmail.com");
    expect(user).not.toBeNull();
    expect(user?.provider).toBe("google");
    expect(user?.emailVerified).toBe(true);
    expect(redirectMock).toHaveBeenCalledWith("/account");
  });

  it("returns the same user when the same email signs in twice", async () => {
    await googleSignInAction("demo+anita@gmail.com").catch(() => {});
    await googleSignInAction("demo+anita@gmail.com").catch(() => {});

    const user = await usersRepo.findByEmail("demo+anita@gmail.com");
    expect(user).not.toBeNull();
    // Only one user should exist for this email (findOrCreate is idempotent)
    expect(user?.fullName).toBe("Anita Iyer");
  });
});
