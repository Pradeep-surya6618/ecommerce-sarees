import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const optionalEmail = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(z.email().optional());

const optionalUrl = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(z.url().optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.url(),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  SESSION_COOKIE_NAME: z.string().min(1).default("ssn"),
  ADMIN_BOOTSTRAP_EMAIL: z.email(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8),

  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  DDB_TABLE_PREFIX: z.string().min(1),

  S3_BUCKET: optionalString,
  S3_PUBLIC_PREFIX: z.string().default("public/"),
  CDN_BASE_URL: optionalUrl,

  SES_SMTP_HOST: optionalString,
  SES_SMTP_PORT: z.coerce.number().int().positive().default(587),
  SES_SMTP_USER: optionalString,
  SES_SMTP_PASSWORD: optionalString,
  MAIL_FROM: optionalString,
  ADMIN_NOTIFY_EMAIL: optionalEmail,

  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: optionalString,

  SHIPROCKET_EMAIL: optionalEmail,
  SHIPROCKET_PASSWORD: optionalString,
  SHIPROCKET_WEBHOOK_SECRET: optionalString,
  // Origin pincode shipments dispatch from — required for live rate quotes.
  SHIPROCKET_PICKUP_PINCODE: optionalString,

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  RATE_LIMIT_SALT: z.string().min(1),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ");
    throw new Error(`Invalid environment configuration:\n  ${issues}`);
  }
  return parsed.data;
}

export const env: Env = loadEnv();
