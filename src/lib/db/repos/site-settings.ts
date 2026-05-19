import type { AnnouncementSettings, SiteSettings } from "@/types/domain";

const DEFAULT_SETTINGS: SiteSettings = {
  announcement: {
    message: "Free shipping pan-India on orders over ₹2,000 · COD available",
    enabled: true,
  },
};

export interface SiteSettingsRepo {
  get(): Promise<SiteSettings>;
  updateAnnouncement(input: AnnouncementSettings): Promise<SiteSettings>;
}

declare global {
  var __mockSiteSettings: SiteSettings | undefined;
}

function getStore(): SiteSettings {
  if (globalThis.__mockSiteSettings) return globalThis.__mockSiteSettings;
  const seed: SiteSettings = {
    announcement: { ...DEFAULT_SETTINGS.announcement },
  };
  globalThis.__mockSiteSettings = seed;
  return seed;
}

export const siteSettingsRepo: SiteSettingsRepo = {
  async get() {
    return getStore();
  },

  async updateAnnouncement(input) {
    const store = getStore();
    store.announcement = {
      message: input.message,
      enabled: input.enabled,
    };
    return store;
  },
};

export function __resetSiteSettingsRepo(): void {
  globalThis.__mockSiteSettings = undefined;
}
