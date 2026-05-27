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
import { checkRateLimits, getClientIp } from "@/lib/rate-limit/check";
import type { OtpPurpose } from "@/types/domain";

// Rate-limit policies — fixed windows. The Ephemeral table TTL evicts the
// counters automatically after each window closes.
const LIMITS = {
  loginPerIp: { max: 10, windowSeconds: 15 * 60 },
  loginPerEmail: { max: 5, windowSeconds: 15 * 60 },
  signupPerIp: { max: 5, windowSeconds: 60 * 60 },
  verifyPerEmail: { max: 10, windowSeconds: 15 * 60 },
  otpPerEmail: { max: 3, windowSeconds: 60 * 60 },
} as const;

// Helper — create the OTP record and dispatch the email. Email failures are
// logged but don't abort the action (the code is still stored, the user can
// click "Resend"). This avoids leaking SES outage details to the customer.
//
// `pendingPasswordHash` rides along on the OTP row so the consume-side can
// apply it to the user — used when a Google-only account is gaining a
// password via the signup form.
async function issueOtp(
  email: string,
  purpose: OtpPurpose,
  pendingPasswordHash?: string,
): Promise<void> {
  const code = generateOtpCode();
  await otpsRepo.create({
    email,
    purpose,
    code,
    ttlSeconds: OTP_TTL_SECONDS,
    pendingPasswordHash,
  });
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
  const ip = await getClientIp();
  const email = input.email.trim().toLowerCase();
  const check = await checkRateLimits([
    { scope: "signup", kind: "ip", key: ip, ...LIMITS.signupPerIp },
    { scope: "otp", kind: "email", key: email, ...LIMITS.otpPerEmail },
  ]);
  if (!check.ok) throw new Error(check.error);

  const existing = await usersRepo.findByEmail(input.email);

  // Account-linking path: the email is already on file via Google sign-in but
  // has no password yet. Hash the chosen password and stash it on the OTP
  // record — we'll write it to the user only after they enter the code, which
  // proves they control the gmail inbox.
  if (existing && existing.provider === "google" && !existing.passwordHash) {
    const passwordHash = await hashPassword(input.password);
    await issueOtp(input.email, "signup", passwordHash);
    redirect(`/auth/verify?email=${encodeURIComponent(email)}`);
  }

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
  redirect(`/auth/verify?email=${encodeURIComponent(email)}`);
}

export interface VerifyOtpInput {
  email: string;
  code: string;
}

export async function verifyOtpAction(input: VerifyOtpInput): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const check = await checkRateLimits([
    { scope: "verify", kind: "email", key: email, ...LIMITS.verifyPerEmail },
  ]);
  if (!check.ok) throw new Error(check.error);

  const user = await usersRepo.findByEmail(input.email);
  if (!user) {
    throw new Error("No account found for this email.");
  }
  const active = await otpsRepo.findActive(input.email, "signup");
  if (!active || active.code !== input.code) {
    throw new Error("The code you entered is incorrect or expired.");
  }
  await otpsRepo.consume(input.email, "signup");
  // Account-linking finalisation: the OTP carried a pending password hash
  // from signupAction — apply it now that inbox ownership is proven.
  if (active.pendingPasswordHash) {
    await usersRepo.updatePasswordHash(user.id, active.pendingPasswordHash);
  }
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
  const email = input.email.trim().toLowerCase();
  const check = await checkRateLimits([
    { scope: "otp", kind: "email", key: email, ...LIMITS.otpPerEmail },
  ]);
  if (!check.ok) throw new Error(check.error);

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
  const ip = await getClientIp();
  const email = input.email.trim().toLowerCase();
  const check = await checkRateLimits([
    { scope: "login", kind: "ip", key: ip, ...LIMITS.loginPerIp },
    { scope: "login", kind: "email", key: email, ...LIMITS.loginPerEmail },
  ]);
  if (!check.ok) return { ok: false, error: check.error };

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
  // Per-IP only — using a per-email bucket would let an attacker time responses
  // to enumerate accounts. The IP cap (signupPerIp budget) is enough to stop
  // bulk abuse without leaking which addresses are registered.
  const ip = await getClientIp();
  const check = await checkRateLimits([
    { scope: "reset", kind: "ip", key: ip, ...LIMITS.signupPerIp },
  ]);
  if (!check.ok) throw new Error(check.error);

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
  const email = input.email.trim().toLowerCase();
  const check = await checkRateLimits([
    { scope: "reset-verify", kind: "email", key: email, ...LIMITS.verifyPerEmail },
  ]);
  if (!check.ok) throw new Error(check.error);

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
