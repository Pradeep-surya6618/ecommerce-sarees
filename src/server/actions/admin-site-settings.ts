"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import type { AnnouncementSettings } from "@/types/domain";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    throw new Error("Admin access required.");
  }
  return user;
}

export async function updateAnnouncementAction(input: AnnouncementSettings): Promise<void> {
  await requireAdmin();
  const message = input.message.trim();
  if (input.enabled && !message) {
    throw new Error("Message is required when the announcement is enabled.");
  }
  await siteSettingsRepo.updateAnnouncement({
    message,
    enabled: input.enabled,
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}
