import { DeleteCommand, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { OtpPurpose, OtpRecord } from "@/types/domain";

export interface CreateOtpInput {
  email: string;
  purpose: OtpPurpose;
  code: string;
  ttlSeconds: number;
  /** Carried alongside the code; consumed-side reads + applies it to the user. */
  pendingPasswordHash?: string;
}

export interface OtpsRepo {
  create(input: CreateOtpInput): Promise<OtpRecord>;
  findActive(email: string, purpose: OtpPurpose): Promise<OtpRecord | null>;
  consume(email: string, purpose: OtpPurpose): Promise<void>;
}

// OTPs live in the shared `Ephemeral` table.
//   PK = "OTP#<email>"
//   SK = "<purpose>"   ("signup" | "password-reset")
// One active code per (email, purpose) — re-issuing for the same pair just
// overwrites the previous row. DDB TTL auto-evicts after the code's expiry;
// findActive also re-checks expiry on read to handle TTL delivery lag.

function table(): string {
  return tableName(TABLES.Ephemeral);
}

function otpPk(email: string): string {
  return `OTP#${normaliseEmail(email)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

interface OtpRow {
  pk: string;
  sk: string;
  otpId: string;
  email: string;
  purpose: OtpPurpose;
  code: string;
  expiresAt: number; // epoch seconds for DDB TTL
  expiresAtIso: string;
  consumedAt: string | null;
  pendingPasswordHash?: string;
}

function toItem(rec: OtpRecord): OtpRow {
  const row: OtpRow = {
    pk: otpPk(rec.email),
    sk: rec.purpose,
    otpId: rec.id,
    email: rec.email,
    purpose: rec.purpose,
    code: rec.code,
    expiresAt: Math.floor(Date.parse(rec.expiresAt) / 1000),
    expiresAtIso: rec.expiresAt,
    consumedAt: rec.consumedAt,
  };
  if (rec.pendingPasswordHash) row.pendingPasswordHash = rec.pendingPasswordHash;
  return row;
}

function fromItem(item: Record<string, unknown> | undefined): OtpRecord | null {
  if (!item) return null;
  const otpId = item.otpId as string | undefined;
  const email = item.email as string | undefined;
  const purpose = item.purpose as OtpPurpose | undefined;
  const code = item.code as string | undefined;
  const expiresAtIso = item.expiresAtIso as string | undefined;
  const consumedAt = (item.consumedAt as string | null | undefined) ?? null;
  const pendingPasswordHash = item.pendingPasswordHash as string | undefined;
  if (!otpId || !email || !purpose || !code || !expiresAtIso) return null;
  const record: OtpRecord = {
    id: otpId,
    email,
    purpose,
    code,
    expiresAt: expiresAtIso,
    consumedAt,
  };
  if (pendingPasswordHash) record.pendingPasswordHash = pendingPasswordHash;
  return record;
}

export const otpsRepo: OtpsRepo = {
  async create(input) {
    const expiresIso = new Date(Date.now() + input.ttlSeconds * 1000).toISOString();
    const record: OtpRecord = {
      id: `otp_${nanoid(12)}`,
      email: normaliseEmail(input.email),
      purpose: input.purpose,
      code: input.code,
      expiresAt: expiresIso,
      consumedAt: null,
    };
    if (input.pendingPasswordHash) record.pendingPasswordHash = input.pendingPasswordHash;
    await getDdbDoc().send(new PutCommand({ TableName: table(), Item: toItem(record) }));
    return record;
  },

  async findActive(email, purpose) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { pk: otpPk(email), sk: purpose },
      }),
    );
    const record = fromItem(res.Item);
    if (!record) return null;
    if (record.consumedAt) return null;
    if (Date.parse(record.expiresAt) <= Date.now()) {
      // DDB TTL deletion can lag by minutes — clean up eagerly.
      await getDdbDoc().send(
        new DeleteCommand({
          TableName: table(),
          Key: { pk: otpPk(email), sk: purpose },
        }),
      );
      return null;
    }
    return record;
  },

  async consume(email, purpose) {
    await getDdbDoc().send(
      new UpdateCommand({
        TableName: table(),
        Key: { pk: otpPk(email), sk: purpose },
        UpdateExpression: "SET consumedAt = :c",
        ExpressionAttributeValues: { ":c": nowIso() },
        ConditionExpression: "attribute_exists(pk)",
      }),
    );
  },
};
