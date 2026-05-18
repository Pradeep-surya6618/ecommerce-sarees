import { nanoid } from "nanoid";
import type { AuthProvider, User, UserRole } from "@/types/domain";

export interface CreateUserInput {
  email: string;
  fullName: string;
  passwordHash: string;
  role?: UserRole;
  provider?: AuthProvider;
}

export interface UsersRepo {
  create(input: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  markEmailVerified(id: string): Promise<User | null>;
  updatePasswordHash(id: string, passwordHash: string): Promise<User | null>;
  findOrCreateGoogle(input: { email: string; fullName: string }): Promise<User>;
  promoteToAdmin(id: string): Promise<User | null>;
  listCustomers(options?: { search?: string; limit?: number }): Promise<User[]>;
  blockUser(id: string): Promise<User | null>;
  unblockUser(id: string): Promise<User | null>;
}

declare global {
  var __mockUsers: Map<string, User> | undefined;

  var __mockUsersByEmail: Map<string, string> | undefined;
}

const users: Map<string, User> = globalThis.__mockUsers ?? (globalThis.__mockUsers = new Map());
const byEmail: Map<string, string> =
  globalThis.__mockUsersByEmail ?? (globalThis.__mockUsersByEmail = new Map());

function nowIso(): string {
  return new Date().toISOString();
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const usersRepo: UsersRepo = {
  async create(input) {
    const email = normaliseEmail(input.email);
    if (byEmail.has(email)) {
      throw new Error("A user with this email already exists.");
    }
    const now = nowIso();
    const user: User = {
      id: `usr_${nanoid(12)}`,
      email,
      fullName: input.fullName,
      passwordHash: input.passwordHash,
      emailVerified: false,
      role: input.role ?? "customer",
      provider: input.provider ?? "email",
      blocked: false,
      createdAt: now,
      updatedAt: now,
    };
    users.set(user.id, user);
    byEmail.set(email, user.id);
    return user;
  },

  async findByEmail(email) {
    const id = byEmail.get(normaliseEmail(email));
    return id ? (users.get(id) ?? null) : null;
  },

  async findById(id) {
    return users.get(id) ?? null;
  },

  async markEmailVerified(id) {
    const user = users.get(id);
    if (!user) return null;
    user.emailVerified = true;
    user.updatedAt = nowIso();
    return user;
  },

  async updatePasswordHash(id, passwordHash) {
    const user = users.get(id);
    if (!user) return null;
    user.passwordHash = passwordHash;
    user.updatedAt = nowIso();
    return user;
  },

  async findOrCreateGoogle({ email, fullName }) {
    const normEmail = normaliseEmail(email);
    const existing = await usersRepo.findByEmail(normEmail);
    if (existing) return existing;
    const now = nowIso();
    const user: User = {
      id: `usr_${nanoid(12)}`,
      email: normEmail,
      fullName,
      passwordHash: "",
      emailVerified: true,
      role: "customer",
      provider: "google",
      blocked: false,
      createdAt: now,
      updatedAt: now,
    };
    users.set(user.id, user);
    byEmail.set(normEmail, user.id);
    return user;
  },

  async promoteToAdmin(id) {
    const user = users.get(id);
    if (!user) return null;
    user.role = "admin";
    user.updatedAt = nowIso();
    return user;
  },

  async listCustomers(options) {
    let result = [...users.values()].filter((u) => u.role === "customer");
    if (options?.search) {
      const needle = options.search.toLowerCase();
      result = result.filter(
        (u) => u.email.toLowerCase().includes(needle) || u.fullName.toLowerCase().includes(needle),
      );
    }
    result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (options?.limit !== undefined) {
      result = result.slice(0, options.limit);
    }
    return result;
  },

  async blockUser(id) {
    const user = users.get(id);
    if (!user) return null;
    user.blocked = true;
    user.updatedAt = nowIso();
    return user;
  },

  async unblockUser(id) {
    const user = users.get(id);
    if (!user) return null;
    user.blocked = false;
    user.updatedAt = nowIso();
    return user;
  },
};

export function __resetUsersRepo(): void {
  users.clear();
  byEmail.clear();
}
