import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const minimalEnv = {
  NODE_ENV: "test",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  JWT_ACCESS_SECRET: "x".repeat(32),
  SESSION_COOKIE_NAME: "ssn",
  ADMIN_BOOTSTRAP_EMAIL: "admin@example.com",
  ADMIN_BOOTSTRAP_PASSWORD: "ChangeMe!23",
  AWS_REGION: "ap-south-1",
  AWS_ACCESS_KEY_ID: "AKIA000000000000",
  AWS_SECRET_ACCESS_KEY: "secret-secret-secret-secret-secret",
  DDB_TABLE_PREFIX: "test_",
  S3_BUCKET: "b",
  S3_PUBLIC_PREFIX: "public/",
  CDN_BASE_URL: "https://cdn.example.com",
  SES_SMTP_HOST: "h",
  SES_SMTP_PORT: "587",
  SES_SMTP_USER: "u",
  SES_SMTP_PASSWORD: "p",
  MAIL_FROM: "Test <no-reply@example.com>",
  ADMIN_NOTIFY_EMAIL: "ops@example.com",
  RAZORPAY_KEY_ID: "rzp",
  RAZORPAY_KEY_SECRET: "rzps",
  RAZORPAY_WEBHOOK_SECRET: "rzpw",
  NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_pub",
  SHIPROCKET_EMAIL: "sr@example.com",
  SHIPROCKET_PASSWORD: "sr",
  SHIPROCKET_WEBHOOK_SECRET: "srw",
  RATE_LIMIT_SALT: "salt",
  LOG_LEVEL: "info",
} as const;

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("env", () => {
  it("parses a valid environment", async () => {
    process.env = { ...originalEnv, ...minimalEnv };
    const { env } = await import("./env");
    expect(env.JWT_ACCESS_SECRET).toHaveLength(32);
    expect(env.SES_SMTP_PORT).toBe(587);
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("throws when JWT secret is too short", async () => {
    process.env = { ...originalEnv, ...minimalEnv, JWT_ACCESS_SECRET: "short" };
    await expect(import("./env")).rejects.toThrow(/JWT_ACCESS_SECRET/);
  });

  it("requires NEXT_PUBLIC_SITE_URL to be a URL", async () => {
    process.env = { ...originalEnv, ...minimalEnv, NEXT_PUBLIC_SITE_URL: "not-a-url" };
    await expect(import("./env")).rejects.toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});
