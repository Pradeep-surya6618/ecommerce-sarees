// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    SES_SMTP_HOST: "email-smtp.ap-south-1.amazonaws.com",
    SES_SMTP_PORT: 587,
    SES_SMTP_USER: "u",
    SES_SMTP_PASSWORD: "p",
    MAIL_FROM: "Saree Store <no-reply@example.com>",
  },
}));

describe("mail transport", () => {
  it("returns the same transporter across calls", async () => {
    const { getMailer } = await import("./transport");
    expect(getMailer()).toBe(getMailer());
  });

  it("exposes the configured From address", async () => {
    const { MAIL_FROM } = await import("./transport");
    expect(MAIL_FROM).toContain("no-reply@example.com");
  });
});
