"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateOtpCode, OTP_TTL_SECONDS } from "@/lib/auth/otp";
import { hashPasswordStub, verifyPasswordStub } from "@/lib/auth/passwords";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session-cookie";
import { clearGuestSessionCookie } from "@/lib/cart/clear-guest-session";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo } from "@/lib/db/repos/cart";
import { otpsRepo } from "@/lib/db/repos/otps";
import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";
import type { OtpPurpose } from "@/types/domain";

export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
}

export async function signupAction(input: SignupInput): Promise<void> {
  const existing = await usersRepo.findByEmail(input.email);
  if (existing) {
    throw new Error("A user with this email already exists.");
  }
  const passwordHash = await hashPasswordStub(input.password);
  await usersRepo.create({
    email: input.email,
    fullName: input.fullName,
    passwordHash,
  });
  await otpsRepo.create({
    email: input.email,
    purpose: "signup",
    code: generateOtpCode(),
    ttlSeconds: OTP_TTL_SECONDS,
  });
  redirect(`/auth/verify?email=${encodeURIComponent(input.email.toLowerCase())}`);
}

export interface VerifyOtpInput {
  email: string;
  code: string;
}

export async function verifyOtpAction(input: VerifyOtpInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (!user) {
    throw new Error("No account found for this email.");
  }
  const active = await otpsRepo.findActive(input.email, "signup");
  if (!active || active.code !== input.code) {
    throw new Error("The code you entered is incorrect or expired.");
  }
  await otpsRepo.consume(active.id);
  await usersRepo.markEmailVerified(user.id);

  await issueSessionAndMergeCart(user.id);
  revalidatePath("/", "layout");
  redirect("/account");
}

export interface ResendOtpInput {
  email: string;
  purpose: OtpPurpose;
}

export async function resendOtpAction(input: ResendOtpInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (!user) return;
  await otpsRepo.create({
    email: input.email,
    purpose: input.purpose,
    code: generateOtpCode(),
    ttlSeconds: OTP_TTL_SECONDS,
  });
}

export interface LoginInput {
  email: string;
  password: string;
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAction(input: LoginInput): Promise<LoginResult> {
  const user = await usersRepo.findByEmail(input.email);
  if (!user) {
    return { ok: false, error: "Email or password is incorrect." };
  }
  const ok = await verifyPasswordStub(input.password, user.passwordHash);
  if (!ok) {
    return { ok: false, error: "Email or password is incorrect." };
  }
  if (!user.emailVerified) {
    await otpsRepo.create({
      email: user.email,
      purpose: "signup",
      code: generateOtpCode(),
      ttlSeconds: OTP_TTL_SECONDS,
    });
    redirect(`/auth/verify?email=${encodeURIComponent(user.email)}`);
  }

  await issueSessionAndMergeCart(user.id);
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/");
}

export interface ForgotPasswordInput {
  email: string;
}

export async function requestPasswordResetAction(input: ForgotPasswordInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (user) {
    await otpsRepo.create({
      email: user.email,
      purpose: "password-reset",
      code: generateOtpCode(),
      ttlSeconds: OTP_TTL_SECONDS,
    });
  }
  redirect(`/auth/reset-password?email=${encodeURIComponent(input.email.toLowerCase())}`);
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  password: string;
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (!user) {
    throw new Error("No account found for this email.");
  }
  const active = await otpsRepo.findActive(input.email, "password-reset");
  if (!active || active.code !== input.code) {
    throw new Error("The code you entered is incorrect or expired.");
  }
  await otpsRepo.consume(active.id);
  const hash = await hashPasswordStub(input.password);
  await usersRepo.updatePasswordHash(user.id, hash);
  await issueSessionAndMergeCart(user.id);
  revalidatePath("/", "layout");
  redirect("/account");
}

async function issueSessionAndMergeCart(userId: string): Promise<void> {
  const session = await sessionsRepo.create(userId);
  await setSessionCookie(session.id);
  const guestSessionId = await getGuestSessionId();
  if (guestSessionId) {
    await cartRepo.mergeGuestIntoUser(guestSessionId, userId);
    await clearGuestSessionCookie();
  } else {
    await cartRepo.getOrCreateForUser(userId);
  }
}
