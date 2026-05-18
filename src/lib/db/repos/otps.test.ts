import { beforeEach, describe, expect, it } from "vitest";
import { __resetOtpsRepo, otpsRepo } from "./otps";

describe("otpsRepo (mock)", () => {
  beforeEach(() => __resetOtpsRepo());

  it("creates an OTP record and finds the active one by email + purpose", async () => {
    const record = await otpsRepo.create({
      email: "a@example.com",
      purpose: "signup",
      code: "123456",
      ttlSeconds: 600,
    });
    expect(record.id).toMatch(/^otp_/);

    const found = await otpsRepo.findActive("a@example.com", "signup");
    expect(found?.id).toBe(record.id);
  });

  it("consumes an OTP and excludes it from active lookups", async () => {
    await otpsRepo.create({
      email: "b@example.com",
      purpose: "signup",
      code: "123456",
      ttlSeconds: 600,
    });
    const active = await otpsRepo.findActive("b@example.com", "signup");
    expect(active).not.toBeNull();
    await otpsRepo.consume(active!.id);
    expect(await otpsRepo.findActive("b@example.com", "signup")).toBeNull();
  });

  it("treats expired OTPs as inactive", async () => {
    await otpsRepo.create({
      email: "c@example.com",
      purpose: "password-reset",
      code: "123456",
      ttlSeconds: -1,
    });
    expect(await otpsRepo.findActive("c@example.com", "password-reset")).toBeNull();
  });
});
