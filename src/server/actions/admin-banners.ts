"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { bannersRepo } from "@/lib/db/repos/banners";
import type { BannerInput } from "@/types/domain";

export type BannerActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

export async function createBannerAction(input: BannerInput): Promise<BannerActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const banner = await bannersRepo.create(input);
    revalidatePath("/", "layout");
    revalidatePath("/admin/banners");
    return { ok: true, id: banner.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create banner.";
    return { ok: false, error: message };
  }
}

export async function updateBannerAction(
  id: string,
  input: Partial<BannerInput>,
): Promise<BannerActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    const updated = await bannersRepo.update(id, input);
    if (!updated) return { ok: false, error: "Banner not found." };
    revalidatePath("/", "layout");
    revalidatePath(`/admin/banners/${id}`);
    revalidatePath("/admin/banners");
    return { ok: true, id: updated.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update banner.";
    return { ok: false, error: message };
  }
}

export async function deleteBannerAction(id: string): Promise<BannerActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  try {
    await bannersRepo.delete(id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/banners");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete banner.";
    return { ok: false, error: message };
  }
}
