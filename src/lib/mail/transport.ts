import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

let transporter: Transporter | null = null;

export function getMailer(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SES_SMTP_HOST,
      port: env.SES_SMTP_PORT,
      secure: env.SES_SMTP_PORT === 465,
      auth: { user: env.SES_SMTP_USER, pass: env.SES_SMTP_PASSWORD },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }
  return transporter;
}

export const MAIL_FROM = env.MAIL_FROM;
