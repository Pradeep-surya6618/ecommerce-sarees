import { nanoid } from "nanoid";
import type { OtpPurpose, OtpRecord } from "@/types/domain";

export interface CreateOtpInput {
  email: string;
  purpose: OtpPurpose;
  code: string;
  ttlSeconds: number;
}

export interface OtpsRepo {
  create(input: CreateOtpInput): Promise<OtpRecord>;
  findActive(email: string, purpose: OtpPurpose): Promise<OtpRecord | null>;
  consume(id: string): Promise<void>;
}

const otps = new Map<string, OtpRecord>();

function nowIso(): string {
  return new Date().toISOString();
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const otpsRepo: OtpsRepo = {
  async create(input) {
    const now = Date.now();
    const record: OtpRecord = {
      id: `otp_${nanoid(12)}`,
      email: normaliseEmail(input.email),
      purpose: input.purpose,
      code: input.code,
      expiresAt: new Date(now + input.ttlSeconds * 1000).toISOString(),
      consumedAt: null,
    };
    otps.set(record.id, record);
    return record;
  },

  async findActive(email, purpose) {
    const target = normaliseEmail(email);
    for (const r of [...otps.values()].reverse()) {
      if (r.email !== target) continue;
      if (r.purpose !== purpose) continue;
      if (r.consumedAt !== null) continue;
      if (Date.parse(r.expiresAt) <= Date.now()) continue;
      return r;
    }
    return null;
  },

  async consume(id) {
    const r = otps.get(id);
    if (r) r.consumedAt = nowIso();
  },
};

export function __resetOtpsRepo(): void {
  otps.clear();
}
