import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPasswordStub } from "@/lib/auth/passwords";
import { __resetCartRepo } from "@/lib/db/repos/cart";
import { __resetOtpsRepo, otpsRepo } from "@/lib/db/repos/otps";
import { __resetSessionsRepo } from "@/lib/db/repos/sessions";
import { __resetUsersRepo, usersRepo } from "@/lib/db/repos/users";
import { loginAction, resendOtpAction, signupAction, verifyOtpAction } from "./auth";

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
  getGuestSessionId: vi.fn(async () => "gs_auth_test"),
  ensureGuestSessionId: vi.fn(async () => "gs_auth_test"),
}));

vi.mock("@/lib/cart/clear-guest-session", () => ({
  clearGuestSessionCookie: clearGuestSessionMock,
}));

describe("auth server actions", () => {
  beforeEach(() => {
    __resetUsersRepo();
    __resetSessionsRepo();
    __resetOtpsRepo();
    __resetCartRepo();
    redirectMock.mockClear();
    clearGuestSessionMock.mockClear();
  });

  it("signupAction creates an unverified user and issues a signup OTP", async () => {
    await expect(
      signupAction({
        fullName: "Aishwarya",
        email: "a@example.com",
        password: "Hunter22!",
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const user = await usersRepo.findByEmail("a@example.com");
    expect(user?.emailVerified).toBe(false);

    const otp = await otpsRepo.findActive("a@example.com", "signup");
    expect(otp?.code).toBe("123456");
    expect(redirectMock).toHaveBeenCalledWith("/auth/verify?email=a%40example.com");
  });

  it("signupAction rejects duplicate emails", async () => {
    await usersRepo.create({
      email: "dup@example.com",
      fullName: "Dup",
      passwordHash: await hashPasswordStub("x"),
    });
    await expect(
      signupAction({ fullName: "X", email: "dup@example.com", password: "abcdefgh" }),
    ).rejects.toThrow(/already/i);
  });

  it("verifyOtpAction marks the user verified and creates a session", async () => {
    await signupAction({
      fullName: "Verify Me",
      email: "v@example.com",
      password: "Hunter22!",
    }).catch(() => {});

    await expect(verifyOtpAction({ email: "v@example.com", code: "123456" })).rejects.toThrow(
      /NEXT_REDIRECT/,
    );

    const verified = await usersRepo.findByEmail("v@example.com");
    expect(verified?.emailVerified).toBe(true);
    expect(redirectMock).toHaveBeenLastCalledWith("/account");
  });

  it("verifyOtpAction rejects wrong codes", async () => {
    await signupAction({
      fullName: "Reject",
      email: "r@example.com",
      password: "Hunter22!",
    }).catch(() => {});

    await expect(verifyOtpAction({ email: "r@example.com", code: "000000" })).rejects.toThrow(
      /incorrect|expired|invalid/i,
    );
  });

  it("resendOtpAction issues a fresh OTP for a known unverified email", async () => {
    await signupAction({
      fullName: "Resend",
      email: "s@example.com",
      password: "Hunter22!",
    }).catch(() => {});
    await resendOtpAction({ email: "s@example.com", purpose: "signup" });
    const otp = await otpsRepo.findActive("s@example.com", "signup");
    expect(otp?.code).toBe("123456");
  });

  it("loginAction authenticates a verified user and creates a session", async () => {
    const user = await usersRepo.create({
      email: "login@example.com",
      fullName: "Login",
      passwordHash: await hashPasswordStub("Hunter22!"),
    });
    await usersRepo.markEmailVerified(user.id);

    await expect(
      loginAction({ email: "login@example.com", password: "Hunter22!" }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenLastCalledWith("/account");
  });

  it("loginAction rejects wrong password", async () => {
    const user = await usersRepo.create({
      email: "wp@example.com",
      fullName: "WP",
      passwordHash: await hashPasswordStub("Right!23"),
    });
    await usersRepo.markEmailVerified(user.id);
    await expect(loginAction({ email: "wp@example.com", password: "Wrong!23" })).rejects.toThrow(
      /incorrect/i,
    );
  });

  it("loginAction routes unverified users to /auth/verify", async () => {
    await usersRepo.create({
      email: "uv@example.com",
      fullName: "UV",
      passwordHash: await hashPasswordStub("Hunter22!"),
    });
    await expect(loginAction({ email: "uv@example.com", password: "Hunter22!" })).rejects.toThrow(
      /NEXT_REDIRECT/,
    );
    expect(redirectMock).toHaveBeenLastCalledWith("/auth/verify?email=uv%40example.com");
  });
});
