import type {
  AboutPageContent,
  AnnouncementSettings,
  InstagramSettings,
  SiteSettings,
} from "@/types/domain";

// Initial values are empty. The admin populates these via /admin/settings,
// /admin/about, /admin/instagram, etc. When the Content table migration lands,
// this seed will move to the database.
const EMPTY_ABOUT: AboutPageContent = {
  title: "Our story",
  description: "",
  introBody: "",
  imageUrl: "",
  imageAlt: "",
  beliefHeading: "",
  beliefBody: "",
  teamHeading: "",
  teamBody: "",
};

const EMPTY_INSTAGRAM: InstagramSettings = {
  handle: "",
  ctaHref: "",
  enabled: false,
  tiles: [],
};

const DEFAULT_SETTINGS: SiteSettings = {
  announcement: {
    message: "",
    enabled: false,
  },
  about: EMPTY_ABOUT,
  instagram: EMPTY_INSTAGRAM,
};

export interface SiteSettingsRepo {
  get(): Promise<SiteSettings>;
  updateAnnouncement(input: AnnouncementSettings): Promise<SiteSettings>;
  updateAbout(input: AboutPageContent): Promise<SiteSettings>;
  updateInstagram(input: InstagramSettings): Promise<SiteSettings>;
}

declare global {
  var __mockSiteSettings: SiteSettings | undefined;
}

function getStore(): SiteSettings {
  if (globalThis.__mockSiteSettings) {
    if (!globalThis.__mockSiteSettings.about) {
      globalThis.__mockSiteSettings.about = { ...EMPTY_ABOUT };
    }
    if (!globalThis.__mockSiteSettings.instagram) {
      globalThis.__mockSiteSettings.instagram = {
        ...EMPTY_INSTAGRAM,
        tiles: [],
      };
    }
    return globalThis.__mockSiteSettings;
  }
  const seed: SiteSettings = {
    announcement: { ...DEFAULT_SETTINGS.announcement },
    about: { ...DEFAULT_SETTINGS.about },
    instagram: {
      ...DEFAULT_SETTINGS.instagram,
      tiles: [],
    },
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

  async updateAbout(input) {
    const store = getStore();
    store.about = { ...input };
    return store;
  },

  async updateInstagram(input) {
    const store = getStore();
    store.instagram = {
      handle: input.handle,
      ctaHref: input.ctaHref,
      enabled: input.enabled,
      tiles: input.tiles.map((t) => ({ ...t })),
    };
    return store;
  },
};

export function __resetSiteSettingsRepo(): void {
  globalThis.__mockSiteSettings = undefined;
}
