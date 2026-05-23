import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
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
  deleteById(id: string): Promise<void>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function table(): string {
  return tableName(TABLES.Users);
}

// User is stored with `userId` as the DynamoDB partition key, but the domain
// type uses `id`. Translate at the boundary.
function toItem(user: User): Record<string, unknown> {
  return { ...user, userId: user.id };
}

function fromItem(item: Record<string, unknown> | undefined): User | null {
  if (!item) return null;
  const { userId, ...rest } = item as User & { userId: string };
  return { ...(rest as User), id: userId };
}

export const usersRepo: UsersRepo = {
  async create(input) {
    const email = normaliseEmail(input.email);
    const existing = await usersRepo.findByEmail(email);
    if (existing) {
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
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(user),
        ConditionExpression: "attribute_not_exists(userId)",
      }),
    );
    return user;
  },

  async findByEmail(email) {
    const res = await getDdbDoc().send(
      new QueryCommand({
        TableName: table(),
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": normaliseEmail(email) },
        Limit: 1,
      }),
    );
    return fromItem(res.Items?.[0]);
  },

  async findById(id) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { userId: id },
      }),
    );
    return fromItem(res.Item);
  },

  async markEmailVerified(id) {
    const res = await getDdbDoc().send(
      new UpdateCommand({
        TableName: table(),
        Key: { userId: id },
        UpdateExpression: "SET emailVerified = :v, updatedAt = :u",
        ExpressionAttributeValues: { ":v": true, ":u": nowIso() },
        ConditionExpression: "attribute_exists(userId)",
        ReturnValues: "ALL_NEW",
      }),
    );
    return fromItem(res.Attributes);
  },

  async updatePasswordHash(id, passwordHash) {
    const res = await getDdbDoc().send(
      new UpdateCommand({
        TableName: table(),
        Key: { userId: id },
        UpdateExpression: "SET passwordHash = :p, updatedAt = :u",
        ExpressionAttributeValues: { ":p": passwordHash, ":u": nowIso() },
        ConditionExpression: "attribute_exists(userId)",
        ReturnValues: "ALL_NEW",
      }),
    );
    return fromItem(res.Attributes);
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
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(user),
      }),
    );
    return user;
  },

  async promoteToAdmin(id) {
    const res = await getDdbDoc().send(
      new UpdateCommand({
        TableName: table(),
        Key: { userId: id },
        UpdateExpression: "SET #r = :r, updatedAt = :u",
        ExpressionAttributeNames: { "#r": "role" },
        ExpressionAttributeValues: { ":r": "admin", ":u": nowIso() },
        ConditionExpression: "attribute_exists(userId)",
        ReturnValues: "ALL_NEW",
      }),
    );
    return fromItem(res.Attributes);
  },

  async listCustomers(options) {
    // Scan is acceptable here — admin-only operation, low-volume.
    // If the customer base grows large, add a RoleCreatedIndex GSI
    // (role + createdAt) and Query instead.
    const res = await getDdbDoc().send(
      new ScanCommand({
        TableName: table(),
        FilterExpression: "#r = :customer",
        ExpressionAttributeNames: { "#r": "role" },
        ExpressionAttributeValues: { ":customer": "customer" },
      }),
    );
    let items = (res.Items ?? []).map((i) => fromItem(i)).filter(Boolean) as User[];

    if (options?.search) {
      const needle = options.search.toLowerCase();
      items = items.filter(
        (u) => u.email.toLowerCase().includes(needle) || u.fullName.toLowerCase().includes(needle),
      );
    }
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (options?.limit !== undefined) {
      items = items.slice(0, options.limit);
    }
    return items;
  },

  async blockUser(id) {
    const res = await getDdbDoc().send(
      new UpdateCommand({
        TableName: table(),
        Key: { userId: id },
        UpdateExpression: "SET blocked = :b, updatedAt = :u",
        ExpressionAttributeValues: { ":b": true, ":u": nowIso() },
        ConditionExpression: "attribute_exists(userId)",
        ReturnValues: "ALL_NEW",
      }),
    );
    return fromItem(res.Attributes);
  },

  async unblockUser(id) {
    const res = await getDdbDoc().send(
      new UpdateCommand({
        TableName: table(),
        Key: { userId: id },
        UpdateExpression: "SET blocked = :b, updatedAt = :u",
        ExpressionAttributeValues: { ":b": false, ":u": nowIso() },
        ConditionExpression: "attribute_exists(userId)",
        ReturnValues: "ALL_NEW",
      }),
    );
    return fromItem(res.Attributes);
  },

  async deleteById(id) {
    await getDdbDoc().send(
      new DeleteCommand({
        TableName: table(),
        Key: { userId: id },
      }),
    );
  },
};
