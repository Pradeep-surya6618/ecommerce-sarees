# Saree E-Commerce App

Next.js 16 + React 19 + Tailwind v4 + MUI + AWS (DynamoDB / S3 / SES) + Razorpay + Shiprocket.

See the design spec at [`docs/superpowers/specs/2026-05-16-saree-ecom-design.md`](docs/superpowers/specs/2026-05-16-saree-ecom-design.md).

## Prerequisites

- Node.js 20.x (LTS) or newer
- An AWS account with permission to create DynamoDB tables, S3 buckets, and verify SES senders
- A Razorpay test account (live keys later)
- A Shiprocket account (sandbox + production)

## Local setup

1. Install dependencies:
   ```powershell
   npm install
   ```
2. Copy the env template and fill in real values:
   ```powershell
   Copy-Item .env.example .env.local
   ```
   At minimum set: `JWT_ACCESS_SECRET` (32+ chars), `AWS_*`, `S3_BUCKET`, `CDN_BASE_URL`, `SES_SMTP_*`, `MAIL_FROM`, Razorpay/Shiprocket creds. Use test credentials.
3. Provision DynamoDB tables (idempotent):
   ```powershell
   npm run dynamo:setup
   ```
4. Start the dev server:
   ```powershell
   npm run dev
   ```
5. Confirm health: open <http://localhost:3000/api/health>.

## AWS infrastructure checklist

These steps are performed once per environment. Phase 0 only provides the table-creation script; the rest is manual in the AWS console.

- [ ] Create an IAM user `saree-ecom-app` with programmatic access; attach a least-privilege policy (DynamoDB CRUD on tables matching `${DDB_TABLE_PREFIX}*`, S3 read/write on the bucket, SES `SendRawEmail` for the verified identity). Store the access keys in `.env.local`.
- [ ] Create the S3 bucket `${S3_BUCKET}` in `${AWS_REGION}`. Block public access; serve images through CloudFront only.
- [ ] Create a CloudFront distribution in front of the bucket. Set `CDN_BASE_URL` to the distribution domain.
- [ ] In SES: verify the sender domain in `${AWS_REGION}`. Configure DKIM. Request production access when ready (sandbox by default).
- [ ] Create SES SMTP credentials and set `SES_SMTP_USER` / `SES_SMTP_PASSWORD`.
- [ ] Run `npm run dynamo:setup` to create tables, enable TTL on tables that need it, and enable PITR everywhere.

## Scripts

| Command                   | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `npm run dev`             | Start the Next.js dev server                   |
| `npm run build`           | Production build                               |
| `npm run start`           | Run the production build                       |
| `npm run typecheck`       | TypeScript check (no emit)                     |
| `npm run lint`            | ESLint                                         |
| `npm run format`          | Prettier write                                 |
| `npm run format:check`    | Prettier check                                 |
| `npm run test`            | Unit tests (Vitest)                            |
| `npm run test:watch`      | Vitest in watch mode                           |
| `npm run test:ui`         | Vitest UI                                      |
| `npm run e2e`             | Playwright E2E                                 |
| `npm run e2e:install`     | Install Playwright browsers                    |
| `npm run dynamo:setup`    | Provision DynamoDB tables                      |
| `npm run admin:bootstrap` | Seed the first admin user (stub until Phase 3) |

## Project structure

See [docs/superpowers/specs/2026-05-16-saree-ecom-design.md](docs/superpowers/specs/2026-05-16-saree-ecom-design.md) §4 for the full layout.

## Phase plans

Phase implementation plans live in [`docs/superpowers/plans/`](docs/superpowers/plans/). The first plan is `2026-05-16-phase-0-foundation.md` (this phase).
