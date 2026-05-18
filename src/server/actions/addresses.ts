"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  addressesRepo,
  type CreateAddressInput,
  type UpdateAddressInput,
} from "@/lib/db/repos/addresses";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in to manage your addresses.");
  return user;
}

export type CreateAddressActionInput = Omit<CreateAddressInput, "userId">;

export async function createAddressAction(input: CreateAddressActionInput): Promise<void> {
  const user = await requireUser();
  await addressesRepo.create({ ...input, userId: user.id });
  revalidatePath("/account/addresses");
}

export async function updateAddressAction(id: string, input: UpdateAddressInput): Promise<void> {
  const user = await requireUser();
  const existing = await addressesRepo.getById(id);
  if (!existing || existing.userId !== user.id) {
    throw new Error("Address not found.");
  }
  await addressesRepo.update(id, input);
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(id: string): Promise<void> {
  const user = await requireUser();
  const existing = await addressesRepo.getById(id);
  if (!existing || existing.userId !== user.id) {
    throw new Error("Address not found.");
  }
  await addressesRepo.setDefault(user.id, id);
  revalidatePath("/account/addresses");
}

export async function deleteAddressAction(id: string): Promise<void> {
  const user = await requireUser();
  const existing = await addressesRepo.getById(id);
  if (!existing || existing.userId !== user.id) {
    throw new Error("Address not found.");
  }
  await addressesRepo.delete(id);
  revalidatePath("/account/addresses");
}
