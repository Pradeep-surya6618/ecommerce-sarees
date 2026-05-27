import { headers } from "next/headers";
import { rateLimitsRepo, type RateLimitResult } from "@/lib/db/repos/rate-limits";

export interface RateLimitPolicy {
  /** Where the limit applies — `"login"`, `"signup"`, etc. */
  scope: string;
  /** Per-IP or per-email key value. Hashed with the project salt downstream. */
  key: string;
  /** Sub-bucket — `"ip"` or `"email"`. Lets us hold separate counters per scope. */
  kind: "ip" | "email";
  /** Cap. */
  max: number;
  /** Window in seconds. */
  windowSeconds: number;
}

export interface RateLimitedOutcome {
  ok: false;
  error: string;
  retryAfterSeconds: number;
}

export interface PassedOutcome {
  ok: true;
  results: RateLimitResult[];
}

// Reads the caller's IP from the standard proxy header chain. Vercel sets
// `x-forwarded-for`; behind any other CDN this still works. Falls back to a
// constant when the header is absent (local dev, server-to-server) so the
// limit still applies per process.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    // x-forwarded-for is a comma-separated list; the leftmost is the client.
    return xff.split(",")[0]?.trim() || "unknown";
  }
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || "unknown";
}

function formatRetry(seconds: number): string {
  if (seconds <= 0) return "shortly";
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

// Run every policy in parallel. If any fails, return a single throttled
// outcome with a friendly retry message. Otherwise return all the
// individual results so callers can inspect headroom (count/limit).
export async function checkRateLimits(
  policies: RateLimitPolicy[],
): Promise<RateLimitedOutcome | PassedOutcome> {
  const results = await Promise.all(
    policies.map((p) =>
      rateLimitsRepo.checkAndIncrement(`${p.scope}:${p.kind}:${p.key}`, p.max, p.windowSeconds),
    ),
  );

  const violated = results.findIndex((r) => !r.allowed);
  if (violated >= 0) {
    const r = results[violated]!;
    const policy = policies[violated]!;
    const reason =
      policy.kind === "ip"
        ? "Too many attempts from this device."
        : "Too many attempts for this email.";
    return {
      ok: false,
      error: `${reason} Please try again in ${formatRetry(r.retryAfterSeconds)}.`,
      retryAfterSeconds: r.retryAfterSeconds,
    };
  }
  return { ok: true, results };
}
