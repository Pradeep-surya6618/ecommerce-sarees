import type { OtpPurpose } from "@/types/domain";

/**
 * Demo-mode OTP. In a real backend phase this is replaced with
 * cryptographically-random 6-digit codes and SES delivery.
 */
export const DEMO_OTP_CODE = "123456";
export const OTP_TTL_SECONDS = 60 * 10;

export function generateOtpCode(): string {
  return DEMO_OTP_CODE;
}

export function isValidOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function describeOtp(purpose: OtpPurpose): string {
  return purpose === "signup" ? "Email verification" : "Password reset";
}
