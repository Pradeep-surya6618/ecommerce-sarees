import { nanoid } from "nanoid";
import { usersRepo } from "@/lib/db/repos/users";
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

// Addresses are stored as an embedded array on the User item. Pattern matches
// wishlistRepo — read user, mutate array, write back. Cross-user lookup
// (`getById` with no userId) requires scanning, but it's only used by edit
// pages that also load the user separately, so we accept the trade.

function nowIso(): string {
  return new Date().toISOString();
}

function byOldestFirst(a: SavedAddress, b: SavedAddress): number {
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

async function findOwningUser(
  addressId: string,
): Promise<{ userId: string; list: SavedAddress[] } | null> {
  // SavedAddress.id starts with "addr_" + nanoid(12); we don't know the
  // owner upfront on lookups by id. Pull all customers and find the match.
  // Customer count is bounded (admin scans them anyway), so a single Scan
  // is acceptable here until we add a dedicated address-id GSI.
  const customers = await usersRepo.listCustomers();
  for (const u of customers) {
    const list = u.addresses ?? [];
    if (list.some((a) => a.id === addressId)) {
      return { userId: u.id, list };
    }
  }
  return null;
}

export const addressesRepo: AddressesRepo = {
  async listByUser(userId) {
    const user = await usersRepo.findById(userId);
    if (!user) return [];
    return (user.addresses ?? []).slice().sort(byOldestFirst);
  },

  async getById(id) {
    const owner = await findOwningUser(id);
    if (!owner) return null;
    return owner.list.find((a) => a.id === id) ?? null;
  },

  async create(input) {
    const user = await usersRepo.findById(input.userId);
    if (!user) throw new Error("User not found.");
    const current = user.addresses ?? [];
    const now = nowIso();
    const address: SavedAddress = {
      id: `addr_${nanoid(12)}`,
      ...input,
      isDefault: current.length === 0,
      createdAt: now,
      updatedAt: now,
    };
    await usersRepo.setAddresses(input.userId, [...current, address]);
    return address;
  },

  async update(id, input) {
    const owner = await findOwningUser(id);
    if (!owner) return null;
    let updated: SavedAddress | null = null;
    const next = owner.list.map((a) => {
      if (a.id !== id) return a;
      updated = { ...a, ...input, updatedAt: nowIso() };
      return updated;
    });
    if (!updated) return null;
    await usersRepo.setAddresses(owner.userId, next);
    return updated;
  },

  async delete(id) {
    const owner = await findOwningUser(id);
    if (!owner) return;
    const target = owner.list.find((a) => a.id === id);
    if (!target) return;
    let next = owner.list.filter((a) => a.id !== id);
    // If we removed the default, promote the oldest remaining.
    if (target.isDefault && next.length > 0) {
      next = next
        .slice()
        .sort(byOldestFirst)
        .map((a, idx) => (idx === 0 ? { ...a, isDefault: true, updatedAt: nowIso() } : a));
    }
    await usersRepo.setAddresses(owner.userId, next);
  },

  async setDefault(userId, id) {
    const user = await usersRepo.findById(userId);
    if (!user) return;
    const current = user.addresses ?? [];
    const next = current.map((a) => {
      const shouldBeDefault = a.id === id;
      if (a.isDefault === shouldBeDefault) return a;
      return { ...a, isDefault: shouldBeDefault, updatedAt: nowIso() };
    });
    await usersRepo.setAddresses(userId, next);
  },
};
