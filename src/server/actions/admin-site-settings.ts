"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import type {
  AboutPageContent,
  AnnouncementSettings,
  InstagramSettings,
  InstagramTile,
  SocialLinks,
  StoreProfileSettings,
  VisitSettings,
} from "@/types/domain";

export type SiteSettingsActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true };
}

export async function updateAnnouncementAction(
  input: AnnouncementSettings,
): Promise<SiteSettingsActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const message = input.message.trim();
  if (input.enabled && !message) {
    return { ok: false, error: "Message is required when the announcement is enabled." };
  }
  try {
    await siteSettingsRepo.updateAnnouncement({ message, enabled: input.enabled });
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Failed to save announcement.";
    return { ok: false, error: errMsg };
  }
}

export async function updateAboutAction(
  input: AboutPageContent,
): Promise<SiteSettingsActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
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
  if (!trimmed.title) return { ok: false, error: "Title is required." };
  if (!trimmed.introBody) return { ok: false, error: "Intro paragraph is required." };
  try {
    await siteSettingsRepo.updateAbout(trimmed);
    revalidatePath("/about");
    revalidatePath("/admin/about");
    return { ok: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Failed to save about page.";
    return { ok: false, error: errMsg };
  }
}

function validateUrl(value: string, label: string): string | null {
  if (!value) return null;
  // Allow http(s) URLs only. Reject "javascript:" / scheme-less / etc.
  if (!/^https?:\/\//i.test(value)) {
    return `${label} must start with http:// or https://`;
  }
  return null;
}

export async function updateVisitAction(input: VisitSettings): Promise<SiteSettingsActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const trimmed: VisitSettings = {
    addressLine1: input.addressLine1.trim(),
    addressLine2: input.addressLine2.trim(),
    hours: input.hours.trim(),
    href: input.href.trim(),
  };

  // href is allowed to be a relative path (/contact, /p/contact) or absolute URL.
  if (trimmed.href && !trimmed.href.startsWith("/") && !/^https?:\/\//i.test(trimmed.href)) {
    return {
      ok: false,
      error: "Link target must start with / or http(s)://.",
    };
  }

  try {
    await siteSettingsRepo.updateVisit(trimmed);
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Failed to save visit info.";
    return { ok: false, error: errMsg };
  }
}

// Simple email validator — same shape we use elsewhere. Empty string is
// allowed (admins can clear a field to hide it on the contact page).
function validateEmail(value: string, label: string): string | null {
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `${label} doesn't look like a valid email address.`;
  }
  return null;
}

// GST and PAN format checks. Empty allowed — admin can clear what hasn't been
// registered yet. We do a loose shape match rather than full checksum so
// transitional values during typing aren't rejected.
function validateGst(value: string): string | null {
  if (!value) return null;
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/.test(value)) {
    return "GST number should be 15 characters in the standard GSTIN format.";
  }
  return null;
}

function validatePan(value: string): string | null {
  if (!value) return null;
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
    return "PAN should be 10 characters (5 letters, 4 digits, 1 letter).";
  }
  return null;
}

export async function updateStoreProfileAction(
  input: StoreProfileSettings,
): Promise<SiteSettingsActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const trimmed: StoreProfileSettings = {
    legalName: input.legalName.trim(),
    tradeName: input.tradeName.trim(),
    // GST and PAN are case-sensitive uppercase by convention.
    gstNumber: input.gstNumber.trim().toUpperCase(),
    pan: input.pan.trim().toUpperCase(),
    address: input.address.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    wholesaleEmail: input.wholesaleEmail.trim(),
  };

  const emailErr = validateEmail(trimmed.email, "Contact email");
  if (emailErr) return { ok: false, error: emailErr };
  const wholesaleErr = validateEmail(trimmed.wholesaleEmail, "Wholesale email");
  if (wholesaleErr) return { ok: false, error: wholesaleErr };
  const gstErr = validateGst(trimmed.gstNumber);
  if (gstErr) return { ok: false, error: gstErr };
  const panErr = validatePan(trimmed.pan);
  if (panErr) return { ok: false, error: panErr };

  try {
    await siteSettingsRepo.updateStoreProfile(trimmed);
    revalidatePath("/", "layout");
    revalidatePath("/contact");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Failed to save store profile.";
    return { ok: false, error: errMsg };
  }
}

export async function updateSocialLinksAction(
  input: SocialLinks,
): Promise<SiteSettingsActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const trimmed: SocialLinks = {
    instagram: input.instagram.trim(),
    facebook: input.facebook.trim(),
    pinterest: input.pinterest.trim(),
    youtube: input.youtube.trim(),
    whatsapp: input.whatsapp.trim(),
  };

  for (const [key, value] of Object.entries(trimmed) as [keyof SocialLinks, string][]) {
    const err = validateUrl(value, key.charAt(0).toUpperCase() + key.slice(1));
    if (err) return { ok: false, error: err };
  }

  try {
    await siteSettingsRepo.updateSocial(trimmed);
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Failed to save social links.";
    return { ok: false, error: errMsg };
  }
}

export async function updateInstagramAction(
  input: InstagramSettings,
): Promise<SiteSettingsActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const handle = input.handle.trim();
  const ctaHref = input.ctaHref.trim();
  if (!handle) return { ok: false, error: "Handle is required." };
  if (!ctaHref) return { ok: false, error: "Follow link URL is required." };
  const tiles: InstagramTile[] = input.tiles
    .map((t) => ({
      id: t.id?.trim() || `ig_${nanoid(8)}`,
      imageUrl: t.imageUrl.trim(),
      href: (t.href ?? "").trim(),
      visible: !!t.visible,
    }))
    .filter((t) => t.imageUrl.length > 0);
  try {
    await siteSettingsRepo.updateInstagram({
      handle,
      ctaHref,
      enabled: !!input.enabled,
      tiles,
    });
    revalidatePath("/");
    revalidatePath("/admin/instagram");
    return { ok: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Failed to save Instagram settings.";
    return { ok: false, error: errMsg };
  }
}
