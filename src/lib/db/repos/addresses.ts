import { nanoid } from "nanoid";
import type { SavedAddress } from "@/types/domain";

export type CreateAddressInput = Omit<SavedAddress, "id" | "isDefault" | "createdAt" | "updatedAt">;

export interface UpdateAddressInput {
  fullName?: string;
  phone?: string;
  email?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  label?: string;
}

export interface AddressesRepo {
  listByUser(userId: string): Promise<SavedAddress[]>;
  getById(id: string): Promise<SavedAddress | null>;
  create(input: CreateAddressInput): Promise<SavedAddress>;
  update(id: string, input: UpdateAddressInput): Promise<SavedAddress | null>;
  delete(id: string): Promise<void>;
  setDefault(userId: string, id: string): Promise<void>;
}

declare global {
  var __mockAddresses: Map<string, SavedAddress> | undefined;
}

const addresses: Map<string, SavedAddress> =
  globalThis.__mockAddresses ?? (globalThis.__mockAddresses = new Map());

function nowIso(): string {
  return new Date().toISOString();
}

function listForUser(userId: string): SavedAddress[] {
  return [...addresses.values()]
    .filter((a) => a.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export const addressesRepo: AddressesRepo = {
  async listByUser(userId) {
    return listForUser(userId);
  },

  async getById(id) {
    return addresses.get(id) ?? null;
  },

  async create(input) {
    const userAddresses = listForUser(input.userId);
    const isFirst = userAddresses.length === 0;
    const now = nowIso();
    const address: SavedAddress = {
      id: `addr_${nanoid(12)}`,
      ...input,
      isDefault: isFirst,
      createdAt: now,
      updatedAt: now,
    };
    addresses.set(address.id, address);
    return address;
  },

  async update(id, input) {
    const a = addresses.get(id);
    if (!a) return null;
    Object.assign(a, input, { updatedAt: nowIso() });
    return a;
  },

  async delete(id) {
    const a = addresses.get(id);
    if (!a) return;
    const wasDefault = a.isDefault;
    addresses.delete(id);
    if (wasDefault) {
      const remaining = listForUser(a.userId);
      const promote = remaining[0];
      if (promote) {
        promote.isDefault = true;
        promote.updatedAt = nowIso();
      }
    }
  },

  async setDefault(userId, id) {
    for (const a of listForUser(userId)) {
      const shouldBeDefault = a.id === id;
      if (a.isDefault !== shouldBeDefault) {
        a.isDefault = shouldBeDefault;
        a.updatedAt = nowIso();
      }
    }
  },
};

export function __resetAddressesRepo(): void {
  addresses.clear();
}
