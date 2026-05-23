import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { Session } from "@/types/domain";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30;

export interface CreateSessionOptions {
  ttlSeconds?: number;
}

export interface SessionsRepo {
  create(userId: string, options?: CreateSessionOptions): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  deleteById(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}

// Sessions live in the shared `Ephemeral` table alongside OTPs, rate-limits,
// and webhook events. Each entity uses a different PK prefix so they can share
// the table without colliding.
//   PK = "SESSION#<sessionId>"
//   SK = "META"
//   GSI UserIndex: userId -> pk   (look up sessions for a user)
//   TTL on `expiresAt` (epoch seconds)
const PK_PREFIX = "SESSION#";

function sessionPk(id: string): string {
  return `${PK_PREFIX}${id}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function table(): string {
  return tableName(TABLES.Ephemeral);
}

interface SessionItem {
  pk: string;
  sk: string;
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: number; // epoch seconds for DDB TTL
  expiresAtIso: string;
}

function toItem(session: Session): SessionItem {
  const expiresEpoch = Math.floor(Date.parse(session.expiresAt) / 1000);
  return {
    pk: sessionPk(session.id),
    sk: "META",
    sessionId: session.id,
    userId: session.userId,
    createdAt: session.createdAt,
    expiresAt: expiresEpoch,
    expiresAtIso: session.expiresAt,
  };
}

function fromItem(item: Record<string, unknown> | undefined): Session | null {
  if (!item) return null;
  const sessionId = item.sessionId as string | undefined;
  const userId = item.userId as string | undefined;
  const createdAt = item.createdAt as string | undefined;
  const expiresAtIso = item.expiresAtIso as string | undefined;
  if (!sessionId || !userId || !createdAt || !expiresAtIso) return null;
  return { id: sessionId, userId, createdAt, expiresAt: expiresAtIso };
}

export const sessionsRepo: SessionsRepo = {
  async create(userId, options) {
    const ttl = options?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    const now = Date.now();
    const session: Session = {
      id: `sess_${nanoid(16)}`,
      userId,
      createdAt: nowIso(),
      expiresAt: new Date(now + ttl * 1000).toISOString(),
    };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(session),
      }),
    );
    return session;
  },

  async findById(id) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { pk: sessionPk(id), sk: "META" },
      }),
    );
    const session = fromItem(res.Item);
    if (!session) return null;
    // DynamoDB TTL deletion is best-effort and can lag by minutes. Re-check
    // expiry on read so stale sessions don't slip through.
    if (Date.parse(session.expiresAt) <= Date.now()) {
      await sessionsRepo.deleteById(id);
      return null;
    }
    return session;
  },

  async deleteById(id) {
    await getDdbDoc().send(
      new DeleteCommand({
        TableName: table(),
        Key: { pk: sessionPk(id), sk: "META" },
      }),
    );
  },

  async deleteByUserId(userId) {
    const res = await getDdbDoc().send(
      new QueryCommand({
        TableName: table(),
        IndexName: "UserIndex",
        KeyConditionExpression: "userId = :u AND begins_with(pk, :prefix)",
        ExpressionAttributeValues: { ":u": userId, ":prefix": PK_PREFIX },
      }),
    );
    const items = (res.Items ?? []) as Array<{ pk: string; sk: string }>;
    await Promise.all(
      items.map((item) =>
        getDdbDoc().send(
          new DeleteCommand({
            TableName: table(),
            Key: { pk: item.pk, sk: item.sk },
          }),
        ),
      ),
    );
  },
};
