"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { bannersRepo } from "@/lib/db/repos/banners";
import type { BannerInput } from "@/types/domain";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    throw new Error("Admin access required.");
  }
  return user;
}

export async function createBannerAction(input: BannerInput): Promise<void> {
  await requireAdmin();
  const banner = await bannersRepo.create(input);
  revalidatePath("/", "layout");
  revalidatePath("/admin/banners");
  redirect(`/admin/banners/${banner.id}`);
}

export async function updateBannerAction(id: string, input: Partial<BannerInput>): Promise<void> {
  await requireAdmin();
  await bannersRepo.update(id, input);
  revalidatePath("/", "layout");
  revalidatePath(`/admin/banners/${id}`);
  revalidatePath("/admin/banners");
}

export async function deleteBannerAction(id: string): Promise<void> {
  await requireAdmin();
  await bannersRepo.delete(id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/banners");
  redirect("/admin/banners");
}
