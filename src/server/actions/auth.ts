"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateOtpCode, OTP_TTL_SECONDS } from "@/lib/auth/otp";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session-cookie";
import { clearGuestSessionCookie } from "@/lib/cart/clear-guest-session";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo } from "@/lib/db/repos/cart";
import { otpsRepo } from "@/lib/db/repos/otps";
import { sessionsRepo } from "@/lib/db/repos/sessions";
import { usersRepo } from "@/lib/db/repos/users";
import { logger } from "@/lib/logger";
import { sendOtpEmail } from "@/lib/mail/send-otp";
import type { OtpPurpose } from "@/types/domain";

// Helper — create the OTP record and dispatch the email. Email failures are
// logged but don't abort the action (the code is still stored, the user can
// click "Resend"). This avoids leaking SES outage details to the customer.
async function issueOtp(email: string, purpose: OtpPurpose): Promise<void> {
  const code = generateOtpCode();
  await otpsRepo.create({ email, purpose, code, ttlSeconds: OTP_TTL_SECONDS });
  try {
    await sendOtpEmail({ to: email, code, purpose });
  } catch (err) {
    logger.error({ err, email, purpose }, "Failed to send OTP email");
  }
}

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
  const passwordHash = await hashPassword(input.password);
  await usersRepo.create({
    email: input.email,
    fullName: input.fullName,
    passwordHash,
  });
  await issueOtp(input.email, "signup");
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
  await otpsRepo.consume(input.email, "signup");
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
  await issueOtp(input.email, input.purpose);
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
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    return { ok: false, error: "Email or password is incorrect." };
  }
  if (!user.emailVerified) {
    await issueOtp(user.email, "signup");
    redirect(`/auth/verify?email=${encodeURIComponent(user.email)}`);
  }

  await issueSessionAndMergeCart(user.id);
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie("customer");
  revalidatePath("/", "layout");
  redirect("/");
}

export interface ForgotPasswordInput {
  email: string;
}

export async function requestPasswordResetAction(input: ForgotPasswordInput): Promise<void> {
  const user = await usersRepo.findByEmail(input.email);
  if (user) {
    await issueOtp(user.email, "password-reset");
  }
  // Always redirect — don't leak whether the email exists.
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
  await otpsRepo.consume(input.email, "password-reset");
  const hash = await hashPassword(input.password);
  await usersRepo.updatePasswordHash(user.id, hash);
  await issueSessionAndMergeCart(user.id);
  revalidatePath("/", "layout");
  redirect("/account");
}

async function issueSessionAndMergeCart(userId: string): Promise<void> {
  const session = await sessionsRepo.create(userId);
  await setSessionCookie("customer", session.id);
  const guestSessionId = await getGuestSessionId();
  if (guestSessionId) {
    await cartRepo.mergeGuestIntoUser(guestSessionId, userId);
    await clearGuestSessionCookie();
  } else {
    await cartRepo.getOrCreateForUser(userId);
  }
}
