"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { regionsRepo } from "@/lib/db/repos/regions";
import type { RegionInput } from "@/types/domain";

export type RegionActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

function validate(input: RegionInput): string | null {
  if (!input.state.trim()) return "State is required.";
  if (!input.craft.trim()) return "Craft name is required.";
  if (!input.href.trim()) return "Link target is required.";
  if (!input.imageUrl.trim()) return "Image is required.";
  return null;
}

export async function createRegionAction(input: RegionInput): Promise<RegionActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };
  try {
    const region = await regionsRepo.create({
      state: input.state.trim(),
      craft: input.craft.trim(),
      href: input.href.trim(),
      imageUrl: input.imageUrl.trim(),
      sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
      active: !!input.active,
    });
    revalidatePath("/", "layout");
    revalidatePath("/admin/regions");
    return { ok: true, id: region.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create region.";
    return { ok: false, error: message };
  }
}

export async function updateRegionAction(
  id: string,
  input: RegionInput,
): Promise<RegionActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };
  try {
    const updated = await regionsRepo.update(id, {
      state: input.state.trim(),
      craft: input.craft.trim(),
      href: input.href.trim(),
      imageUrl: input.imageUrl.trim(),
      sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
      active: !!input.active,
    });
    if (!updated) return { ok: false, error: "Region not found." };
    revalidatePath("/", "layout");
    revalidatePath(`/admin/regions/${id}`);
    revalidatePath("/admin/regions");
    return { ok: true, id: updated.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update region.";
    return { ok: false, error: message };
  }
}

export async function deleteRegionAction(id: string): Promise<RegionActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    await regionsRepo.delete(id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/regions");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete region.";
    return { ok: false, error: message };
  }
}
