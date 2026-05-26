import { describeOtp, OTP_TTL_SECONDS } from "@/lib/auth/otp";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getMailer, MAIL_FROM } from "@/lib/mail/transport";
import type { OtpPurpose } from "@/types/domain";

export interface SendOtpInput {
  to: string;
  code: string;
  purpose: OtpPurpose;
}

const TTL_MINUTES = Math.round(OTP_TTL_SECONDS / 60);

function purposeLine(purpose: OtpPurpose): string {
  return purpose === "signup"
    ? "Verify your email to finish setting up your Saree Store account."
    : "Use this code to reset your Saree Store password.";
}

function htmlBody(code: string, purpose: OtpPurpose): string {
  // Inline-styled HTML — most email clients ignore <style> tags / class
  // selectors, so visual styling sits on `style=""` attributes.
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f0eaf3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#251f3e;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0eaf3;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px -16px rgba(37,31,62,0.18);">
            <tr>
              <td style="padding:32px 32px 16px;text-align:center;">
                <span style="display:inline-block;font-family:Georgia,serif;font-size:24px;letter-spacing:0.04em;color:#251f3e;">Saree Store</span>
                <div style="margin:8px auto 0;height:1px;width:48px;background:linear-gradient(to right,transparent,#c9a227,transparent);"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;text-align:center;">
                <p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a227;">${describeOtp(purpose)}</p>
                <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:normal;color:#251f3e;line-height:1.25;">Your one-time code</h1>
                <p style="margin:12px 0 0;font-size:14px;line-height:1.55;color:#6b6580;">${purposeLine(purpose)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;text-align:center;">
                <div style="display:inline-block;padding:16px 24px;background:#f0eaf3;border-radius:12px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:32px;letter-spacing:0.28em;font-weight:600;color:#251f3e;">${code}</div>
                <p style="margin:16px 0 0;font-size:12px;color:#6b6580;">Expires in ${TTL_MINUTES} minutes.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b6580;">
                  If you didn't request this code, you can safely ignore this email — someone may have typed your address by mistake.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #ece7f0;text-align:center;">
                <p style="margin:0;font-size:11px;color:#a39bb8;">© ${new Date().getFullYear()} Saree Store · Slow-woven, fairly sourced.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function textBody(code: string, purpose: OtpPurpose): string {
  return [
    "Saree Store",
    "",
    describeOtp(purpose),
    purposeLine(purpose),
    "",
    `Your code: ${code}`,
    `Expires in ${TTL_MINUTES} minutes.`,
    "",
    "If you didn't request this code, you can safely ignore this email.",
  ].join("\n");
}

export async function sendOtpEmail({ to, code, purpose }: SendOtpInput): Promise<void> {
  // Guard rail: the env may be partially configured in development.
  // Surface a clearer error than Nodemailer's deep stack trace.
  if (!env.SES_SMTP_HOST || !env.SES_SMTP_USER || !env.SES_SMTP_PASSWORD || !MAIL_FROM) {
    throw new Error(
      "Mail transport is not configured. Set SES_SMTP_* and MAIL_FROM in .env.local.",
    );
  }

  const subject =
    purpose === "signup"
      ? `Your Saree Store verification code: ${code}`
      : `Your Saree Store password reset code: ${code}`;

  await getMailer().sendMail({
    from: MAIL_FROM,
    to,
    subject,
    text: textBody(code, purpose),
    html: htmlBody(code, purpose),
  });
  logger.info({ to, purpose }, "OTP email sent");
}
