"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { getCurrentUser } from "@/lib/auth/current-user";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import type {
  AboutPageContent,
  AnnouncementSettings,
  InstagramSettings,
  InstagramTile,
} from "@/types/domain";

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

export async function updateAboutAction(input: AboutPageContent): Promise<void> {
  await requireAdmin();
  const trimmed: AboutPageContent = {
    title: input.title.trim(),
    description: input.description.trim(),
    introBody: input.introBody.trim(),
    imageUrl: input.imageUrl.trim(),
    imageAlt: input.imageAlt.trim(),
    beliefHeading: input.beliefHeading.trim(),
    beliefBody: input.beliefBody.trim(),
    teamHeading: input.teamHeading.trim(),
    teamBody: input.teamBody.trim(),
  };
  if (!trimmed.title) throw new Error("Title is required.");
  if (!trimmed.introBody) throw new Error("Intro paragraph is required.");
  await siteSettingsRepo.updateAbout(trimmed);
  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function updateInstagramAction(input: InstagramSettings): Promise<void> {
  await requireAdmin();
  const handle = input.handle.trim();
  const ctaHref = input.ctaHref.trim();
  if (!handle) throw new Error("Handle is required.");
  if (!ctaHref) throw new Error("Follow link URL is required.");
  // Normalize tiles: trim, drop fully-empty rows, fill missing ids.
  const tiles: InstagramTile[] = input.tiles
    .map((t) => ({
      id: t.id?.trim() || `ig_${nanoid(8)}`,
      imageUrl: t.imageUrl.trim(),
      href: (t.href ?? "").trim(),
      visible: !!t.visible,
    }))
    .filter((t) => t.imageUrl.length > 0);
  await siteSettingsRepo.updateInstagram({ handle, ctaHref, enabled: !!input.enabled, tiles });
  revalidatePath("/");
  revalidatePath("/admin/instagram");
}
