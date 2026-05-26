import { randomInt } from "node:crypto";
import type { OtpPurpose } from "@/types/domain";

// 6-digit numeric OTPs delivered via SES. randomInt is cryptographically
// random and avoids the modulo bias of `Math.floor(Math.random() * 1e6)`.
export const OTP_TTL_SECONDS = 60 * 10;

export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function isValidOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function describeOtp(purpose: OtpPurpose): string {
  return purpose === "signup" ? "Email verification" : "Password reset";
}
