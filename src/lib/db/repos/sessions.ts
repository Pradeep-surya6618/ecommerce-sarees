import { nanoid } from "nanoid";
import type { Session } from "@/types/domain";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30;

export interface CreateSessionOptions {
  ttlSeconds?: number;
}

export interface SessionsRepo {
  create(userId: string, options?: CreateSessionOptions): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  deleteById(id: string): Promise<void>;
}

const sessions = new Map<string, Session>();

function nowIso(): string {
  return new Date().toISOString();
}

export const sessionsRepo: SessionsRepo = {
  async create(userId, options) {
    const ttl = options?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    const session: Session = {
      id: `sess_${nanoid(16)}`,
      userId,
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    };
    sessions.set(session.id, session);
    return session;
  },

  async findById(id) {
    const session = sessions.get(id);
    if (!session) return null;
    if (Date.parse(session.expiresAt) <= Date.now()) {
      sessions.delete(id);
      return null;
    }
    return session;
  },

  async deleteById(id) {
    sessions.delete(id);
  },
};

export function __resetSessionsRepo(): void {
  sessions.clear();
}
