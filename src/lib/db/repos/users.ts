import { nanoid } from "nanoid";
import type { User, UserRole } from "@/types/domain";

export interface CreateUserInput {
  email: string;
  fullName: string;
  passwordHash: string;
  role?: UserRole;
}

export interface UsersRepo {
  create(input: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  markEmailVerified(id: string): Promise<User | null>;
  updatePasswordHash(id: string, passwordHash: string): Promise<User | null>;
}

const users = new Map<string, User>();
const byEmail = new Map<string, string>();

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
};

export function __resetUsersRepo(): void {
  users.clear();
  byEmail.clear();
}
