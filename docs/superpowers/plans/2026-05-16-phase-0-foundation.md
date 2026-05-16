# Phase 0 — Project Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the dependencies, design tokens, structured logging, AWS clients, env validation, testing harness, health check, and DynamoDB setup script that every later phase depends on.

**Architecture:** Single Next.js 16 App-Router app. All third-party clients (DynamoDB, S3, SES SMTP) wrapped in singleton modules under `src/lib/` and configured from a Zod-validated env object. Tailwind v4 design tokens declared in `globals.css` via `@theme inline` and mirrored into an MUI theme so MUI components match. Vitest for unit tests, Playwright for E2E.

**Tech Stack:** Next.js 16.2 (App Router, RSC, Server Actions, React Compiler), React 19.2, TypeScript 5, Tailwind v4, MUI v6 + `@mui/material-nextjs`, Framer Motion, Embla Carousel, React Hook Form + Zod, TanStack Query v5, Lucide React, pino, AWS SDK v3 (DynamoDB + S3), Nodemailer, Razorpay, bcryptjs, jose, nanoid, Vitest, Playwright.

**Reference spec:** `docs/superpowers/specs/2026-05-16-saree-ecom-design.md`.

---

## File Map

Files this phase creates (✚) or modifies (✎):

```
✎ package.json                          # all deps, scripts
✎ tsconfig.json                         # path aliases, strict
✎ next.config.ts                        # output, image domains
✎ eslint.config.mjs                     # add prettier + import sort
✚ .prettierrc.json                      # formatting
✚ .prettierignore
✚ .husky/pre-commit                     # run lint-staged
✚ .lintstagedrc.json
✚ vitest.config.ts                      # test config (jsdom)
✚ vitest.setup.ts                       # @testing-library/jest-dom
✚ playwright.config.ts                  # e2e config
✚ .env.example                          # full var reference
✚ .gitignore (✎)                        # ensure .env.local etc.
✚ src/lib/env.ts                        # Zod-validated env
✚ src/lib/env.test.ts
✚ src/lib/logger.ts                     # pino instance
✚ src/lib/logger.test.ts
✚ src/lib/db/client.ts                  # DocumentClient singleton
✚ src/lib/db/client.test.ts
✚ src/lib/db/tables.ts                  # central table-name builder
✚ src/lib/db/tables.test.ts
✚ src/lib/storage/s3.ts                 # S3 client singleton
✚ src/lib/storage/s3.test.ts
✚ src/lib/mail/transport.ts             # Nodemailer SES SMTP
✚ src/lib/mail/transport.test.ts
✚ src/lib/theme/tokens.ts               # canonical token values
✚ src/lib/theme/mui.ts                  # MUI theme from tokens
✚ src/lib/theme/mui.test.ts
✚ src/app/providers.tsx                 # MUI + TanStack Query providers
✎ src/app/layout.tsx                    # fonts, providers, metadata
✎ src/app/globals.css                   # Tailwind tokens via @theme
✎ src/app/page.tsx                      # placeholder home
✚ src/app/api/health/route.ts           # liveness
✚ src/app/api/health/route.test.ts
✚ scripts/dynamo-setup.ts               # idempotent table creator
✚ scripts/dynamo-setup.test.ts          # parses table specs
✚ scripts/bootstrap-admin.ts            # seed first admin (skeleton)
✚ tests/e2e/smoke.spec.ts               # playwright smoke test
✚ src/types/env.d.ts                    # ProcessEnv augmentation
✚ README.md (✎)                         # runbook
```

Folder placeholders also created to lock structure: `src/components/{ui,storefront,admin,shared}/.gitkeep`, `src/server/{actions,services}/.gitkeep`, `src/lib/{auth,payments,shipping,validation,utils}/.gitkeep`.

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

Run from project root in PowerShell:

```powershell
npm install @mui/material @mui/icons-material @mui/material-nextjs @mui/x-data-grid @emotion/react @emotion/styled @emotion/cache @emotion/server framer-motion embla-carousel-react react-hook-form @hookform/resolvers zod @tanstack/react-query @tanstack/react-query-devtools lucide-react @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-s3 @aws-sdk/s3-request-presigner nodemailer razorpay bcryptjs jose nanoid pino pino-pretty
```

Expected: completes with no peer-dep errors. If npm warns about peer deps for React 19, ignore — MUI v6 supports it.

- [ ] **Step 2: Install dev dependencies**

```powershell
npm install -D @types/nodemailer @types/bcryptjs vitest @vitest/ui @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test prettier eslint-config-prettier eslint-plugin-prettier eslint-plugin-import @ianvs/prettier-plugin-sort-imports husky lint-staged tsx cross-env @types/node
```

Expected: completes cleanly.

- [ ] **Step 3: Add npm scripts**

Edit `package.json` so the `scripts` block reads exactly:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "e2e": "playwright test",
  "e2e:install": "playwright install --with-deps chromium",
  "dynamo:setup": "tsx scripts/dynamo-setup.ts",
  "admin:bootstrap": "tsx scripts/bootstrap-admin.ts",
  "prepare": "husky"
}
```

- [ ] **Step 4: Verify the install succeeded**

Run:

```powershell
npm run typecheck
```

Expected: exits 0, no output (no errors). If it complains about missing types yet, that's fine — later tasks add the source files. Just confirm `node_modules` is healthy and the command runs.

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json
git commit -m "chore: install project dependencies for Phase 0"
```

---

## Task 2: TypeScript Paths and ESLint/Prettier/Husky

**Files:**
- Modify: `tsconfig.json`
- Modify: `eslint.config.mjs`
- Create: `.prettierrc.json`, `.prettierignore`, `.lintstagedrc.json`, `.husky/pre-commit`

- [ ] **Step 1: Replace tsconfig.json**

Overwrite `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/server/*": ["./src/server/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "scripts/**/*.ts",
    "tests/**/*.ts"
  ],
  "exclude": ["node_modules", ".next", "dist"]
}
```

- [ ] **Step 2: Replace eslint.config.mjs**

Overwrite `eslint.config.mjs` with:

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "coverage/**"],
  },
];

export default config;
```

- [ ] **Step 3: Create .prettierrc.json**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["@ianvs/prettier-plugin-sort-imports"],
  "importOrder": [
    "^(react|next)(.*)$",
    "<THIRD_PARTY_MODULES>",
    "^@/lib/(.*)$",
    "^@/server/(.*)$",
    "^@/components/(.*)$",
    "^@/(.*)$",
    "^[./]"
  ]
}
```

- [ ] **Step 4: Create .prettierignore**

```
.next/
node_modules/
dist/
coverage/
package-lock.json
public/
```

- [ ] **Step 5: Create .lintstagedrc.json**

```json
{
  "*.{ts,tsx,js,mjs}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

- [ ] **Step 6: Initialize Husky and create pre-commit hook**

```powershell
npx husky init
```

Then overwrite `.husky/pre-commit` with exactly:

```sh
npx lint-staged
```

- [ ] **Step 7: Verify lint and format both pass**

```powershell
npm run format
npm run lint
npm run typecheck
```

Expected: all three exit 0. (Lint may surface warnings on the default Next.js scaffold; address only errors.)

- [ ] **Step 8: Commit**

```powershell
git add tsconfig.json eslint.config.mjs .prettierrc.json .prettierignore .lintstagedrc.json .husky package.json
git commit -m "chore: configure typescript paths, prettier, husky, lint-staged"
```

---

## Task 3: Vitest and Playwright Setup

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 2: Create vitest.setup.ts**

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 3: Write a sanity Vitest test**

Create `src/lib/_sanity.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("vitest sanity", () => {
  it("adds numbers", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run the sanity test and confirm it passes**

```powershell
npm run test
```

Expected: `1 passed`.

- [ ] **Step 5: Delete the sanity test**

```powershell
Remove-Item src/lib/_sanity.test.ts
```

- [ ] **Step 6: Create playwright.config.ts**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 7: Create a Playwright smoke spec**

Create `tests/e2e/smoke.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("home page responds with 200 and renders body", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
});
```

(Will pass after Task 15 replaces the default home; for now we are only verifying the config compiles.)

- [ ] **Step 8: Commit**

```powershell
git add vitest.config.ts vitest.setup.ts playwright.config.ts tests/e2e/smoke.spec.ts
git commit -m "test: configure vitest and playwright"
```

---

## Task 4: Folder Structure Scaffolding

**Files:**
- Create: `.gitkeep` placeholders for every directory the spec requires.

- [ ] **Step 1: Create folders with placeholder files**

```powershell
$dirs = @(
  "src/app/(storefront)",
  "src/app/(admin)/admin",
  "src/app/api/webhooks",
  "src/app/api/admin",
  "src/app/api/uploads",
  "src/components/ui",
  "src/components/storefront",
  "src/components/admin",
  "src/components/shared",
  "src/lib/auth",
  "src/lib/db",
  "src/lib/mail",
  "src/lib/payments",
  "src/lib/shipping",
  "src/lib/storage",
  "src/lib/theme",
  "src/lib/validation",
  "src/lib/utils",
  "src/server/actions",
  "src/server/services",
  "src/types",
  "src/styles",
  "scripts",
  "tests/e2e"
)
foreach ($d in $dirs) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
  if (-not (Test-Path "$d/.gitkeep")) {
    New-Item -ItemType File -Path "$d/.gitkeep" | Out-Null
  }
}
```

Expected: each directory exists with a `.gitkeep` file.

- [ ] **Step 2: Move the default home page into the (storefront) group**

The default scaffold has `src/app/page.tsx`. The spec puts the home page in the `(storefront)` route group. Move it:

```powershell
Move-Item src/app/page.tsx "src/app/(storefront)/page.tsx"
```

Verify the dev server still resolves `/` correctly by running `npm run dev`, opening http://localhost:3000, and confirming the default Next.js welcome page renders. Then stop the dev server (Ctrl+C).

- [ ] **Step 3: Commit**

```powershell
git add src tests scripts
git commit -m "chore: scaffold folder structure with route groups"
```

---

## Task 5: Environment Validation (.env.example + lib/env.ts)

**Files:**
- Create: `.env.example`, `src/lib/env.ts`, `src/lib/env.test.ts`, `src/types/env.d.ts`

- [ ] **Step 1: Create .env.example**

```
# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# Auth
JWT_ACCESS_SECRET=replace-me-32-char-min-secret-string
SESSION_COOKIE_NAME=ssn
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=ChangeMe!23

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DDB_TABLE_PREFIX=dev_

# S3 / CloudFront
S3_BUCKET=saree-ecom-dev
S3_PUBLIC_PREFIX=public/
CDN_BASE_URL=https://example.cloudfront.net

# Email (SES SMTP via Nodemailer)
SES_SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SES_SMTP_PORT=587
SES_SMTP_USER=
SES_SMTP_PASSWORD=
MAIL_FROM="Saree Store <no-reply@example.com>"
ADMIN_NOTIFY_EMAIL=admin@example.com

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Shiprocket
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
SHIPROCKET_WEBHOOK_SECRET=

# Misc
RATE_LIMIT_SALT=replace-me-random
LOG_LEVEL=info
```

- [ ] **Step 2: Write the failing test for env validation**

Create `src/lib/env.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the failing test**

```powershell
npm run test -- env
```

Expected: 3 tests fail (module not found).

- [ ] **Step 4: Implement src/lib/env.ts**

```ts
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  SESSION_COOKIE_NAME: z.string().min(1).default("ssn"),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8),

  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  DDB_TABLE_PREFIX: z.string().min(1),

  S3_BUCKET: z.string().min(1),
  S3_PUBLIC_PREFIX: z.string().default("public/"),
  CDN_BASE_URL: z.string().url(),

  SES_SMTP_HOST: z.string().min(1),
  SES_SMTP_PORT: z.coerce.number().int().positive().default(587),
  SES_SMTP_USER: z.string().min(1),
  SES_SMTP_PASSWORD: z.string().min(1),
  MAIL_FROM: z.string().min(1),
  ADMIN_NOTIFY_EMAIL: z.string().email(),

  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),

  SHIPROCKET_EMAIL: z.string().email(),
  SHIPROCKET_PASSWORD: z.string().min(1),
  SHIPROCKET_WEBHOOK_SECRET: z.string().min(1),

  RATE_LIMIT_SALT: z.string().min(1),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n  ");
    throw new Error(`Invalid environment configuration:\n  ${issues}`);
  }
  return parsed.data;
}

export const env: Env = loadEnv();
```

- [ ] **Step 5: Run the env test again**

```powershell
npm run test -- env
```

Expected: 3 passed.

- [ ] **Step 6: Create src/types/env.d.ts**

```ts
import type { Env } from "@/lib/env";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Partial<Env> {}
  }
}

export {};
```

- [ ] **Step 7: Verify typecheck**

```powershell
npm run typecheck
```

Expected: exits 0.

- [ ] **Step 8: Commit**

```powershell
git add .env.example src/lib/env.ts src/lib/env.test.ts src/types/env.d.ts
git commit -m "feat(env): add Zod-validated environment config"
```

---

## Task 6: Structured Logger (pino)

**Files:**
- Create: `src/lib/logger.ts`, `src/lib/logger.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/logger.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createLogger } from "./logger";

describe("createLogger", () => {
  it("returns a pino logger with the configured level and bindings", () => {
    const logger = createLogger({ level: "warn", service: "test-service" });
    expect(logger.level).toBe("warn");
    expect(logger.bindings()).toMatchObject({ service: "test-service" });
  });

  it("child loggers inherit bindings", () => {
    const logger = createLogger({ level: "info", service: "parent" });
    const child = logger.child({ requestId: "abc" });
    expect(child.bindings()).toMatchObject({ service: "parent", requestId: "abc" });
  });
});
```

- [ ] **Step 2: Run test, confirm failure**

```powershell
npm run test -- logger
```

Expected: fails (module not found).

- [ ] **Step 3: Implement src/lib/logger.ts**

```ts
import pino, { type Logger, type LoggerOptions } from "pino";
import { env } from "./env";

export interface LoggerConfig {
  level?: LoggerOptions["level"];
  service?: string;
}

const isDev = process.env.NODE_ENV !== "production";

export function createLogger(config: LoggerConfig = {}): Logger {
  const transport = isDev
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss.l", ignore: "pid,hostname" },
      }
    : undefined;

  return pino({
    level: config.level ?? env.LOG_LEVEL,
    base: { service: config.service ?? "saree-ecom" },
    transport,
    redact: {
      paths: [
        "password",
        "passwordHash",
        "*.password",
        "*.passwordHash",
        "authorization",
        "cookie",
        "*.authorization",
      ],
      remove: true,
    },
  });
}

export const logger = createLogger();
```

- [ ] **Step 4: Run test, confirm pass**

```powershell
npm run test -- logger
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/logger.ts src/lib/logger.test.ts
git commit -m "feat(logger): add pino logger with PII redaction"
```

---

## Task 7: Tailwind v4 Tokens, Fonts, and globals.css

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/lib/theme/tokens.ts`
- Modify: `src/app/layout.tsx` (fonts)

- [ ] **Step 1: Replace src/app/globals.css**

```css
@import "tailwindcss";

@theme inline {
  /* Brand color tokens — exported as Tailwind utilities like bg-ink-900, text-accent-primary */
  --color-ink-900: #1f1414;
  --color-ink-700: #3d2929;
  --color-ink-500: #6b5252;
  --color-bg-base: #faf7f2;
  --color-bg-elevated: #ffffff;
  --color-accent-primary: #8e2a2a;
  --color-accent-primary-hover: #761f1f;
  --color-accent-gold: #b8893e;
  --color-success: #1a7a3a;
  --color-warning: #b8722c;
  --color-danger: #b3261e;

  /* Typography */
  --font-display: var(--font-cormorant), "Cormorant Garamond", Georgia, serif;
  --font-body: var(--font-inter), Inter, system-ui, -apple-system, sans-serif;
  --font-sans: var(--font-body);

  /* Type scale */
  --text-2xs: 0.75rem;
  --text-xs: 0.8125rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-md: 1.125rem;
  --text-lg: 1.375rem;
  --text-xl: 1.75rem;
  --text-2xl: 2.25rem;
  --text-3xl: 3rem;
  --text-4xl: 4rem;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 12px;
  --radius-lg: 24px;

  /* Shadows */
  --shadow-card: 0 1px 2px rgba(31, 20, 20, 0.04), 0 8px 24px rgba(31, 20, 20, 0.06);
  --shadow-elev: 0 6px 16px rgba(31, 20, 20, 0.08), 0 24px 48px rgba(31, 20, 20, 0.1);

  /* Motion */
  --ease-default: cubic-bezier(0.2, 0.7, 0.1, 1);
  --duration-fast: 120ms;
  --duration-base: 180ms;
  --duration-slow: 320ms;
}

:root {
  color-scheme: light;
}

html,
body {
  background: var(--color-bg-base);
  color: var(--color-ink-900);
  font-family: var(--font-body);
  font-feature-settings: "ss01", "cv11";
}

body {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1,
h2,
h3 {
  font-family: var(--font-display);
  letter-spacing: -0.01em;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 2: Create src/lib/theme/tokens.ts**

Canonical token values, exported as constants so MUI theme and any JS consumer share one source of truth:

```ts
export const colors = {
  ink900: "#1f1414",
  ink700: "#3d2929",
  ink500: "#6b5252",
  bgBase: "#faf7f2",
  bgElevated: "#ffffff",
  accentPrimary: "#8e2a2a",
  accentPrimaryHover: "#761f1f",
  accentGold: "#b8893e",
  success: "#1a7a3a",
  warning: "#b8722c",
  danger: "#b3261e",
} as const;

export const radii = { sm: 4, md: 12, lg: 24 } as const;

export const typography = {
  display: '"Cormorant Garamond", Georgia, serif',
  body: "Inter, system-ui, -apple-system, sans-serif",
} as const;

export const durations = { fast: 120, base: 180, slow: 320 } as const;

export type Colors = typeof colors;
```

- [ ] **Step 3: Update src/app/layout.tsx with fonts and metadata**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Saree Store", template: "%s · Saree Store" },
  description: "Premium handpicked sarees and ethnic wear.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verify dev server renders with new tokens**

```powershell
npm run dev
```

Open http://localhost:3000. Confirm the page now has the warm-ivory background and Inter body font. Stop the dev server (Ctrl+C).

- [ ] **Step 5: Commit**

```powershell
git add src/app/globals.css src/app/layout.tsx src/lib/theme/tokens.ts
git commit -m "feat(theme): add Tailwind v4 tokens and Cormorant + Inter fonts"
```

---

## Task 8: MUI Theme Bridge and Providers

**Files:**
- Create: `src/lib/theme/mui.ts`, `src/lib/theme/mui.test.ts`, `src/app/providers.tsx`
- Modify: `src/app/layout.tsx` (wrap children in providers)

- [ ] **Step 1: Write the failing test for the MUI theme**

Create `src/lib/theme/mui.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { muiTheme } from "./mui";
import { colors, radii } from "./tokens";

describe("muiTheme", () => {
  it("maps brand colors onto the MUI palette", () => {
    expect(muiTheme.palette.primary.main).toBe(colors.accentPrimary);
    expect(muiTheme.palette.text.primary).toBe(colors.ink900);
    expect(muiTheme.palette.background.default).toBe(colors.bgBase);
  });

  it("uses the brand radius and body font", () => {
    expect(muiTheme.shape.borderRadius).toBe(radii.sm);
    expect(muiTheme.typography.fontFamily).toContain("Inter");
  });
});
```

- [ ] **Step 2: Run the failing test**

```powershell
npm run test -- mui
```

Expected: fails (module not found).

- [ ] **Step 3: Implement src/lib/theme/mui.ts**

```ts
import { createTheme } from "@mui/material/styles";
import { colors, radii, typography } from "./tokens";

export const muiTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: colors.accentPrimary, dark: colors.accentPrimaryHover, contrastText: "#fff" },
    secondary: { main: colors.accentGold, contrastText: "#fff" },
    text: { primary: colors.ink900, secondary: colors.ink700, disabled: colors.ink500 },
    background: { default: colors.bgBase, paper: colors.bgElevated },
    success: { main: colors.success },
    warning: { main: colors.warning },
    error: { main: colors.danger },
  },
  shape: { borderRadius: radii.sm },
  typography: {
    fontFamily: typography.body,
    h1: { fontFamily: typography.display },
    h2: { fontFamily: typography.display },
    h3: { fontFamily: typography.display },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: radii.sm } },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: radii.md } },
    },
  },
});
```

- [ ] **Step 4: Run test, confirm pass**

```powershell
npm run test -- mui
```

Expected: 2 passed.

- [ ] **Step 5: Create src/app/providers.tsx**

```tsx
"use client";

import { useState } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { muiTheme } from "@/lib/theme/mui";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: true }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
```

> Note: `@mui/material-nextjs/v15-appRouter` is the App-Router-compatible entry. MUI v6 published it under v15 and continues to support it on Next 16.

- [ ] **Step 6: Wrap children in Providers in src/app/layout.tsx**

Update `src/app/layout.tsx`'s body:

```tsx
<body>
  <Providers>{children}</Providers>
</body>
```

And add the import at the top:

```ts
import { Providers } from "./providers";
```

- [ ] **Step 7: Smoke-test the dev server**

```powershell
npm run dev
```

Open http://localhost:3000, confirm no React hydration errors in the browser console. Stop the dev server.

- [ ] **Step 8: Commit**

```powershell
git add src/lib/theme/mui.ts src/lib/theme/mui.test.ts src/app/providers.tsx src/app/layout.tsx
git commit -m "feat(theme): bridge Tailwind tokens into MUI theme + providers"
```

---

## Task 9: DynamoDB Client + Tables Helper

**Files:**
- Create: `src/lib/db/client.ts`, `src/lib/db/client.test.ts`, `src/lib/db/tables.ts`, `src/lib/db/tables.test.ts`

- [ ] **Step 1: Write the failing test for the tables helper**

Create `src/lib/db/tables.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { DDB_TABLE_PREFIX: "dev_" } }));

describe("tableName", () => {
  it("prefixes the logical name", async () => {
    const { tableName, TABLES } = await import("./tables");
    expect(tableName(TABLES.Users)).toBe("dev_Users");
    expect(tableName(TABLES.Orders)).toBe("dev_Orders");
  });

  it("exposes every entity from the spec", async () => {
    const { TABLES } = await import("./tables");
    const expected = [
      "Users",
      "OtpCodes",
      "Sessions",
      "Categories",
      "Products",
      "Inventory",
      "Carts",
      "Addresses",
      "Orders",
      "Coupons",
      "Banners",
      "Reviews",
      "BlogPosts",
      "WebhookEvents",
      "AdminAuditLog",
      "Settings",
      "RateLimits",
    ];
    for (const name of expected) {
      expect(TABLES[name as keyof typeof TABLES]).toBe(name);
    }
  });
});
```

- [ ] **Step 2: Run the failing test**

```powershell
npm run test -- tables
```

Expected: fails (module not found).

- [ ] **Step 3: Implement src/lib/db/tables.ts**

```ts
import { env } from "@/lib/env";

export const TABLES = {
  Users: "Users",
  OtpCodes: "OtpCodes",
  Sessions: "Sessions",
  Categories: "Categories",
  Products: "Products",
  Inventory: "Inventory",
  Carts: "Carts",
  Addresses: "Addresses",
  Orders: "Orders",
  Coupons: "Coupons",
  Banners: "Banners",
  Reviews: "Reviews",
  BlogPosts: "BlogPosts",
  WebhookEvents: "WebhookEvents",
  AdminAuditLog: "AdminAuditLog",
  Settings: "Settings",
  RateLimits: "RateLimits",
} as const;

export type LogicalTable = (typeof TABLES)[keyof typeof TABLES];

export function tableName(name: LogicalTable): string {
  return `${env.DDB_TABLE_PREFIX}${name}`;
}
```

- [ ] **Step 4: Run test, confirm pass**

```powershell
npm run test -- tables
```

Expected: 2 passed.

- [ ] **Step 5: Write the failing test for the DDB client**

Create `src/lib/db/client.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    AWS_REGION: "ap-south-1",
    AWS_ACCESS_KEY_ID: "AKIA000000000000",
    AWS_SECRET_ACCESS_KEY: "secret-secret-secret-secret-secret",
  },
}));

describe("ddb client", () => {
  it("returns the same DocumentClient on repeat calls (singleton)", async () => {
    const { getDdbDoc } = await import("./client");
    const a = getDdbDoc();
    const b = getDdbDoc();
    expect(a).toBe(b);
  });

  it("exposes the underlying low-level client too", async () => {
    const { getDdbRaw } = await import("./client");
    const raw = getDdbRaw();
    expect(typeof raw.send).toBe("function");
  });
});
```

- [ ] **Step 6: Run the failing test**

```powershell
npm run test -- "db/client"
```

Expected: fails (module not found).

- [ ] **Step 7: Implement src/lib/db/client.ts**

```ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env } from "@/lib/env";

let rawClient: DynamoDBClient | null = null;
let docClient: DynamoDBDocumentClient | null = null;

function buildRaw(): DynamoDBClient {
  return new DynamoDBClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export function getDdbRaw(): DynamoDBClient {
  if (!rawClient) rawClient = buildRaw();
  return rawClient;
}

export function getDdbDoc(): DynamoDBDocumentClient {
  if (!docClient) {
    docClient = DynamoDBDocumentClient.from(getDdbRaw(), {
      marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false },
    });
  }
  return docClient;
}
```

- [ ] **Step 8: Run test, confirm pass**

```powershell
npm run test -- "db/client"
```

Expected: 2 passed.

- [ ] **Step 9: Commit**

```powershell
git add src/lib/db
git commit -m "feat(db): add DynamoDB DocumentClient singleton and table-name helper"
```

---

## Task 10: S3 Client Wrapper

**Files:**
- Create: `src/lib/storage/s3.ts`, `src/lib/storage/s3.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/storage/s3.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    AWS_REGION: "ap-south-1",
    AWS_ACCESS_KEY_ID: "AKIA000000000000",
    AWS_SECRET_ACCESS_KEY: "secret-secret-secret-secret-secret",
    S3_BUCKET: "saree-ecom-dev",
    S3_PUBLIC_PREFIX: "public/",
    CDN_BASE_URL: "https://cdn.example.com",
  },
}));

describe("s3", () => {
  it("returns the same S3Client across calls", async () => {
    const { getS3 } = await import("./s3");
    expect(getS3()).toBe(getS3());
  });

  it("converts S3 keys to CDN URLs", async () => {
    const { cdnUrl } = await import("./s3");
    expect(cdnUrl("public/products/abc.jpg")).toBe(
      "https://cdn.example.com/public/products/abc.jpg",
    );
    expect(cdnUrl("/public/x.jpg")).toBe("https://cdn.example.com/public/x.jpg");
  });
});
```

- [ ] **Step 2: Run the failing test**

```powershell
npm run test -- "storage/s3"
```

Expected: fails (module not found).

- [ ] **Step 3: Implement src/lib/storage/s3.ts**

```ts
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

let client: S3Client | null = null;

export function getS3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export const S3_BUCKET = env.S3_BUCKET;
export const S3_PUBLIC_PREFIX = env.S3_PUBLIC_PREFIX;

export function cdnUrl(key: string): string {
  const trimmed = key.replace(/^\/+/, "");
  return `${env.CDN_BASE_URL.replace(/\/+$/, "")}/${trimmed}`;
}
```

- [ ] **Step 4: Run test, confirm pass**

```powershell
npm run test -- "storage/s3"
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/storage
git commit -m "feat(storage): add S3 client singleton and CDN URL helper"
```

---

## Task 11: Nodemailer SES SMTP Transport

**Files:**
- Create: `src/lib/mail/transport.ts`, `src/lib/mail/transport.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/mail/transport.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the failing test**

```powershell
npm run test -- mail
```

Expected: fails (module not found).

- [ ] **Step 3: Implement src/lib/mail/transport.ts**

```ts
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
```

- [ ] **Step 4: Run test, confirm pass**

```powershell
npm run test -- mail
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/mail
git commit -m "feat(mail): add Nodemailer SES SMTP transport singleton"
```

---

## Task 12: Health Check Route Handler

**Files:**
- Create: `src/app/api/health/route.ts`, `src/app/api/health/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/health/route.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { NODE_ENV: "test", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },
}));

describe("GET /api/health", () => {
  it("returns 200 with status=ok and a timestamp", async () => {
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; timestamp: string };
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(Number.isFinite(Date.parse(body.timestamp))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing test**

```powershell
npm run test -- health
```

Expected: fails (module not found).

- [ ] **Step 3: Implement src/app/api/health/route.ts**

```ts
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
}
```

- [ ] **Step 4: Run the test, confirm pass**

```powershell
npm run test -- health
```

Expected: 1 passed.

- [ ] **Step 5: Manually verify via dev server**

```powershell
npm run dev
```

Open http://localhost:3000/api/health in a browser. Expected response body:
```json
{ "status": "ok", "timestamp": "<ISO>", "env": "development" }
```
Stop the dev server.

- [ ] **Step 6: Commit**

```powershell
git add src/app/api/health
git commit -m "feat(api): add health check route"
```

---

## Task 13: DynamoDB Setup Script (Idempotent Table Creator)

**Files:**
- Create: `scripts/dynamo-setup.ts`, `scripts/dynamo-setup.test.ts`

This script creates every table the spec defines, with the correct keys, GSIs, billing mode, TTL, and PITR. It is idempotent: running twice is safe.

- [ ] **Step 1: Write the failing test (parses the spec list)**

Create `scripts/dynamo-setup.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TABLE_SPECS } from "./dynamo-setup";

describe("TABLE_SPECS", () => {
  it("covers every entity in the design spec", () => {
    const names = TABLE_SPECS.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Users",
        "OtpCodes",
        "Sessions",
        "Categories",
        "Products",
        "Inventory",
        "Carts",
        "Addresses",
        "Orders",
        "Coupons",
        "Banners",
        "Reviews",
        "BlogPosts",
        "WebhookEvents",
        "AdminAuditLog",
        "Settings",
        "RateLimits",
      ]),
    );
  });

  it("declares every table with a primary key", () => {
    for (const spec of TABLE_SPECS) {
      expect(spec.hashKey, `${spec.name} missing hashKey`).toBeTruthy();
    }
  });

  it("enables TTL where the spec requires it", () => {
    const ttlExpected = ["OtpCodes", "Sessions", "Carts", "WebhookEvents", "RateLimits"];
    for (const name of ttlExpected) {
      const spec = TABLE_SPECS.find((t) => t.name === name);
      expect(spec?.ttlAttribute, `${name} should have a TTL attribute`).toBeTruthy();
    }
  });

  it("declares GSIs the access patterns require", () => {
    const users = TABLE_SPECS.find((t) => t.name === "Users");
    expect(users?.gsis?.map((g) => g.name)).toContain("EmailIndex");
    const products = TABLE_SPECS.find((t) => t.name === "Products");
    expect(products?.gsis?.map((g) => g.name)).toEqual(
      expect.arrayContaining(["SlugIndex", "CategoryStatusIndex"]),
    );
    const orders = TABLE_SPECS.find((t) => t.name === "Orders");
    expect(orders?.gsis?.map((g) => g.name)).toEqual(
      expect.arrayContaining(["UserCreatedIndex", "StatusCreatedIndex"]),
    );
  });
});
```

- [ ] **Step 2: Run the failing test**

```powershell
npm run test -- dynamo
```

Expected: fails (module not found).

- [ ] **Step 3: Implement scripts/dynamo-setup.ts**

```ts
/* eslint-disable no-console */
import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceInUseException,
  ResourceNotFoundException,
  UpdateContinuousBackupsCommand,
  UpdateTimeToLiveCommand,
  type AttributeDefinition,
  type CreateTableCommandInput,
  type GlobalSecondaryIndex,
  type KeySchemaElement,
} from "@aws-sdk/client-dynamodb";
import { getDdbRaw } from "@/lib/db/client";
import { tableName, TABLES, type LogicalTable } from "@/lib/db/tables";
import { logger } from "@/lib/logger";

interface GsiSpec {
  name: string;
  hashKey: string;
  hashKeyType?: "S" | "N";
  rangeKey?: string;
  rangeKeyType?: "S" | "N";
}

export interface TableSpec {
  name: LogicalTable;
  hashKey: string;
  hashKeyType?: "S" | "N";
  rangeKey?: string;
  rangeKeyType?: "S" | "N";
  gsis?: GsiSpec[];
  ttlAttribute?: string;
}

export const TABLE_SPECS: TableSpec[] = [
  {
    name: TABLES.Users,
    hashKey: "userId",
    gsis: [{ name: "EmailIndex", hashKey: "email" }],
  },
  {
    name: TABLES.OtpCodes,
    hashKey: "email",
    rangeKey: "purposeOtpId",
    ttlAttribute: "expiresAt",
  },
  {
    name: TABLES.Sessions,
    hashKey: "sessionId",
    gsis: [{ name: "UserIndex", hashKey: "userId" }],
    ttlAttribute: "expiresAt",
  },
  {
    name: TABLES.Categories,
    hashKey: "categoryId",
    gsis: [{ name: "SlugIndex", hashKey: "slug" }],
  },
  {
    name: TABLES.Products,
    hashKey: "productId",
    gsis: [
      { name: "SlugIndex", hashKey: "slug" },
      { name: "CategoryStatusIndex", hashKey: "categoryId", rangeKey: "statusCreatedAt" },
    ],
  },
  { name: TABLES.Inventory, hashKey: "productId", rangeKey: "variantSku" },
  {
    name: TABLES.Carts,
    hashKey: "cartId",
    gsis: [
      { name: "UserIndex", hashKey: "userId" },
      { name: "SessionIndex", hashKey: "guestSessionId" },
    ],
    ttlAttribute: "expiresAt",
  },
  { name: TABLES.Addresses, hashKey: "userId", rangeKey: "addressId" },
  {
    name: TABLES.Orders,
    hashKey: "orderId",
    gsis: [
      { name: "UserCreatedIndex", hashKey: "userId", rangeKey: "createdAt" },
      { name: "StatusCreatedIndex", hashKey: "status", rangeKey: "createdAt" },
    ],
  },
  {
    name: TABLES.Coupons,
    hashKey: "code",
    gsis: [{ name: "StatusIndex", hashKey: "status", rangeKey: "validTo" }],
  },
  {
    name: TABLES.Banners,
    hashKey: "bannerId",
    gsis: [{ name: "PlacementIndex", hashKey: "placement", rangeKey: "sortOrder", rangeKeyType: "N" }],
  },
  {
    name: TABLES.Reviews,
    hashKey: "productId",
    rangeKey: "reviewId",
    gsis: [{ name: "UserIndex", hashKey: "userId", rangeKey: "createdAt" }],
  },
  {
    name: TABLES.BlogPosts,
    hashKey: "postId",
    gsis: [
      { name: "SlugIndex", hashKey: "slug" },
      { name: "StatusPublishedIndex", hashKey: "status", rangeKey: "publishedAt" },
    ],
  },
  { name: TABLES.WebhookEvents, hashKey: "eventKey", ttlAttribute: "expiresAt" },
  {
    name: TABLES.AdminAuditLog,
    hashKey: "logId",
    gsis: [{ name: "ActorIndex", hashKey: "actorId", rangeKey: "createdAt" }],
  },
  { name: TABLES.Settings, hashKey: "scope", rangeKey: "key" },
  { name: TABLES.RateLimits, hashKey: "bucketKey", ttlAttribute: "expiresAt" },
];

function attrDefs(spec: TableSpec): AttributeDefinition[] {
  const attrs = new Map<string, "S" | "N">();
  attrs.set(spec.hashKey, spec.hashKeyType ?? "S");
  if (spec.rangeKey) attrs.set(spec.rangeKey, spec.rangeKeyType ?? "S");
  for (const gsi of spec.gsis ?? []) {
    attrs.set(gsi.hashKey, gsi.hashKeyType ?? "S");
    if (gsi.rangeKey) attrs.set(gsi.rangeKey, gsi.rangeKeyType ?? "S");
  }
  return [...attrs.entries()].map(([AttributeName, AttributeType]) => ({
    AttributeName,
    AttributeType,
  }));
}

function keySchema(hashKey: string, rangeKey?: string): KeySchemaElement[] {
  const schema: KeySchemaElement[] = [{ AttributeName: hashKey, KeyType: "HASH" }];
  if (rangeKey) schema.push({ AttributeName: rangeKey, KeyType: "RANGE" });
  return schema;
}

function gsiDefs(spec: TableSpec): GlobalSecondaryIndex[] | undefined {
  if (!spec.gsis?.length) return undefined;
  return spec.gsis.map((g) => ({
    IndexName: g.name,
    KeySchema: keySchema(g.hashKey, g.rangeKey),
    Projection: { ProjectionType: "ALL" },
  }));
}

async function tableExists(physicalName: string): Promise<boolean> {
  try {
    await getDdbRaw().send(new DescribeTableCommand({ TableName: physicalName }));
    return true;
  } catch (err) {
    if (err instanceof ResourceNotFoundException) return false;
    throw err;
  }
}

async function createTable(spec: TableSpec): Promise<void> {
  const physicalName = tableName(spec.name);
  if (await tableExists(physicalName)) {
    logger.info({ table: physicalName }, "table already exists, skipping create");
    return;
  }

  const input: CreateTableCommandInput = {
    TableName: physicalName,
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: attrDefs(spec),
    KeySchema: keySchema(spec.hashKey, spec.rangeKey),
    GlobalSecondaryIndexes: gsiDefs(spec),
  };

  try {
    await getDdbRaw().send(new CreateTableCommand(input));
    logger.info({ table: physicalName }, "table created");
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      logger.info({ table: physicalName }, "table already in use, skipping");
      return;
    }
    throw err;
  }
}

async function waitForActive(physicalName: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    const res = await getDdbRaw().send(new DescribeTableCommand({ TableName: physicalName }));
    if (res.Table?.TableStatus === "ACTIVE") return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Table ${physicalName} did not become ACTIVE within timeout`);
}

async function ensureTtl(spec: TableSpec): Promise<void> {
  if (!spec.ttlAttribute) return;
  const physicalName = tableName(spec.name);
  try {
    await getDdbRaw().send(
      new UpdateTimeToLiveCommand({
        TableName: physicalName,
        TimeToLiveSpecification: { Enabled: true, AttributeName: spec.ttlAttribute },
      }),
    );
    logger.info({ table: physicalName, attr: spec.ttlAttribute }, "ttl enabled");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("TimeToLive is already enabled")) return;
    throw err;
  }
}

async function ensurePitr(physicalName: string): Promise<void> {
  try {
    await getDdbRaw().send(
      new UpdateContinuousBackupsCommand({
        TableName: physicalName,
        PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
      }),
    );
    logger.info({ table: physicalName }, "PITR enabled");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Continuous backups are already enabled")) return;
    throw err;
  }
}

async function main(): Promise<void> {
  logger.info("Starting DynamoDB table setup");
  for (const spec of TABLE_SPECS) {
    await createTable(spec);
  }
  for (const spec of TABLE_SPECS) {
    const physical = tableName(spec.name);
    await waitForActive(physical);
    await ensureTtl(spec);
    await ensurePitr(physical);
  }
  logger.info("DynamoDB setup complete");
}

if (process.argv[1]?.includes("dynamo-setup")) {
  main().catch((err) => {
    logger.error({ err }, "dynamo setup failed");
    process.exit(1);
  });
}
```

- [ ] **Step 4: Run the unit test, confirm pass**

```powershell
npm run test -- dynamo
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```powershell
git add scripts/dynamo-setup.ts scripts/dynamo-setup.test.ts
git commit -m "feat(scripts): add idempotent DynamoDB table-setup script"
```

> Note: The script will be executed against real AWS in Task 16 (manual runbook step), not as part of this commit.

---

## Task 14: Admin Bootstrap Script (Skeleton)

**Files:**
- Create: `scripts/bootstrap-admin.ts`

This script is a stub for now; Task 14 of Phase 3 (Auth) will fill in the actual user-creation logic. We create the skeleton so the env vars and CLI entry point are wired up early.

- [ ] **Step 1: Create scripts/bootstrap-admin.ts**

```ts
/* eslint-disable no-console */
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

async function main(): Promise<void> {
  logger.info(
    { email: env.ADMIN_BOOTSTRAP_EMAIL },
    "admin bootstrap stub — implementation lands in Phase 3 (Auth)",
  );
  console.log(
    "Bootstrap admin is a stub. It becomes functional after Phase 3 implements lib/auth and the Users repository.",
  );
}

main().catch((err) => {
  logger.error({ err }, "admin bootstrap failed");
  process.exit(1);
});
```

- [ ] **Step 2: Verify it runs without errors**

```powershell
npm run admin:bootstrap
```

Expected: prints the stub message and exits 0. (Requires `.env.local` to exist with at least `ADMIN_BOOTSTRAP_EMAIL` set, or skip running and just confirm typecheck passes.)

If you don't have an `.env.local` yet, instead run:

```powershell
npm run typecheck
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```powershell
git add scripts/bootstrap-admin.ts
git commit -m "feat(scripts): add admin bootstrap skeleton"
```

---

## Task 15: Replace Default Home with Token-Driven Placeholder

**Files:**
- Modify: `src/app/(storefront)/page.tsx`

- [ ] **Step 1: Replace src/app/(storefront)/page.tsx**

```tsx
import Button from "@mui/material/Button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg-base text-ink-900">
      <section className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-24">
        <span className="text-xs uppercase tracking-widest text-accent-gold">Coming soon</span>
        <h1 className="font-display text-5xl md:text-6xl text-ink-900">
          Handpicked sarees, woven with care.
        </h1>
        <p className="max-w-prose text-ink-700">
          Phase 0 foundation is live. Tokens, theme, AWS clients, health check, and DynamoDB
          setup script are in place. The storefront is the next phase.
        </p>
        <Button variant="contained" color="primary" size="large">
          Explore the collection
        </Button>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Run the dev server and visually verify**

```powershell
npm run dev
```

Open http://localhost:3000. Expect:
- Warm ivory background (`#FAF7F2`).
- Headline in Cormorant Garamond serif.
- Body text in Inter.
- A deep-crimson MUI Button labelled "Explore the collection".

Stop the dev server (Ctrl+C).

- [ ] **Step 3: Run the Playwright smoke test**

```powershell
npm run e2e:install
npm run e2e
```

Expected: the smoke test passes (home returns 2xx, body visible). If Playwright reports browsers missing, the `e2e:install` step above installs them.

- [ ] **Step 4: Commit**

```powershell
git add src/app/(storefront)/page.tsx
git commit -m "feat(home): replace scaffold page with token-driven placeholder"
```

---

## Task 16: README Runbook

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README.md**

```markdown
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

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:ui` | Vitest UI |
| `npm run e2e` | Playwright E2E |
| `npm run e2e:install` | Install Playwright browsers |
| `npm run dynamo:setup` | Provision DynamoDB tables |
| `npm run admin:bootstrap` | Seed the first admin user (stub until Phase 3) |

## Project structure

See [docs/superpowers/specs/2026-05-16-saree-ecom-design.md](docs/superpowers/specs/2026-05-16-saree-ecom-design.md) §4 for the full layout.

## Phase plans

Phase implementation plans live in [`docs/superpowers/plans/`](docs/superpowers/plans/). The first plan is `2026-05-16-phase-0-foundation.md` (this phase).
```

- [ ] **Step 2: Commit**

```powershell
git add README.md
git commit -m "docs: add Phase 0 runbook and AWS setup checklist to README"
```

---

## Task 17: Final Verification

- [ ] **Step 1: Format, lint, typecheck, unit tests**

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run test
```

Expected: all four exit 0.

- [ ] **Step 2: Build**

```powershell
npm run build
```

Expected: build succeeds. (The build does NOT require AWS connectivity — env vars only need to be *present*, not functional, because `lib/env.ts` runs only when modules importing it are executed; the build phase imports `env.ts` indirectly via `app/api/health/route.ts`, but the values in `.env.example` copied to `.env.local` are syntactically valid placeholders.)

If the build fails because of missing env vars, ensure `.env.local` exists with every key from `.env.example` populated (placeholder values are fine for typecheck/build).

- [ ] **Step 3: Tag the phase complete**

```powershell
git tag -a phase-0-complete -m "Phase 0 (foundation) complete"
```

(Push the tag later when convenient.)

---

## What's NOT in this phase (deferred to later)

- Actual auth (signup, login, OTP, sessions) — Phase 3.
- DynamoDB repository functions for any entity — Phase 2 onward, per entity.
- S3 presigned-URL upload route — Phase 2 (with product CRUD).
- Real Razorpay or Shiprocket integration — Phases 5 and 7.
- Storefront components (cards, hero, gallery, etc.) — Phase 1.
- Admin shell UI — Phase 2.

---

## Self-Review Notes

- All `.gitkeep` files will be replaced with real code in later phases — they only serve to lock structure for the file map.
- The `bootstrap-admin.ts` stub is deliberate; turning it into a working seeder requires `lib/auth` and Users repository code that Phase 3 introduces. The script's purpose in Phase 0 is to lock the CLI entry point and env shape.
- `dynamo-setup.ts` is only unit-tested for spec coverage and key wiring; the real integration check happens manually against AWS via `npm run dynamo:setup` after credentials are populated. That manual run is explicit in the README runbook.
- Money-as-paise (spec §1) is not asserted in Phase 0 because there is no money code yet; Phase 4 (cart) is the first place an integer-paise type is needed.
- Spec coverage at end of Phase 0: §1 overview ✓ (architecture stood up), §2 decisions ✓ (deps + theme + clients), §3 architecture ✓ (route groups + middleware location reserved), §4 folder structure ✓ (scaffolded), §5 data model ✓ (setup script + tables helper), §16 env vars ✓. Sections 6–13 (auth, cart, checkout, payments, shipping, emails, admin, UI components) are explicitly out of scope for Phase 0 and have their own phase plans to be written.
