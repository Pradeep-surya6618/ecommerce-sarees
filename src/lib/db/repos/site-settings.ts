import type {
  AboutPageContent,
  AnnouncementSettings,
  InstagramSettings,
  SiteSettings,
} from "@/types/domain";

const DEFAULT_ABOUT: AboutPageContent = {
  title: "Our story",
  description: "Sarees, sourced directly from weavers across India.",
  introBody:
    "Saree Store began as a notebook of weavers. Over four years we have walked through Kanchipuram, Varanasi, Paithan, Pochampally, Maheshwar, and the Bengali looms — meeting the people behind the pieces, learning what makes each tradition specific, and building relationships that let us bring their work to a wider audience without losing the thread of the craft.",
  imageUrl:
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80",
  imageAlt: "Weaver at a handloom",
  beliefHeading: "What we believe",
  beliefBody:
    "Heritage isn't a marketing word. It is a record of decisions — fibre, dye, motif, proportion — that have survived because they worked. We try to honour those decisions and explain them clearly enough that customers can recognise them, too.",
  teamHeading: "Who works on this",
  teamBody:
    "A small team across Bengaluru and Kanchipuram. We work with cooperatives that pay weavers above the regional floor; that pay arrives before our pieces ship. Photography is in-house. Customer service goes to humans, not bots.",
};

const DEFAULT_INSTAGRAM: InstagramSettings = {
  handle: "@saree.store",
  ctaHref: "https://instagram.com",
  enabled: true,
  tiles: [
    {
      id: "ig_1",
      imageUrl:
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
      href: "https://instagram.com",
      visible: true,
    },
    {
      id: "ig_2",
      imageUrl:
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
      href: "https://instagram.com",
      visible: true,
    },
    {
      id: "ig_3",
      imageUrl:
        "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80",
      href: "https://instagram.com",
      visible: true,
    },
    {
      id: "ig_4",
      imageUrl:
        "https://images.unsplash.com/photo-1583391733981-86d0d2c0e9aa?auto=format&fit=crop&w=600&q=80",
      href: "https://instagram.com",
      visible: true,
    },
    {
      id: "ig_5",
      imageUrl:
        "https://images.unsplash.com/photo-1610030469973-e1b80fb95e36?auto=format&fit=crop&w=600&q=80",
      href: "https://instagram.com",
      visible: true,
    },
    {
      id: "ig_6",
      imageUrl:
        "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=600&q=80",
      href: "https://instagram.com",
      visible: true,
    },
  ],
};

const DEFAULT_SETTINGS: SiteSettings = {
  announcement: {
    message: "Free shipping pan-India on orders over ₹2,000 · COD available",
    enabled: true,
  },
  about: DEFAULT_ABOUT,
  instagram: DEFAULT_INSTAGRAM,
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
    // Backfill any new fields that older seeds may not have had.
    if (!globalThis.__mockSiteSettings.about) {
      globalThis.__mockSiteSettings.about = { ...DEFAULT_ABOUT };
    }
    if (!globalThis.__mockSiteSettings.instagram) {
      globalThis.__mockSiteSettings.instagram = {
        ...DEFAULT_INSTAGRAM,
        tiles: DEFAULT_INSTAGRAM.tiles.map((t) => ({ ...t })),
      };
    }
    return globalThis.__mockSiteSettings;
  }
  const seed: SiteSettings = {
    announcement: { ...DEFAULT_SETTINGS.announcement },
    about: { ...DEFAULT_SETTINGS.about },
    instagram: {
      ...DEFAULT_SETTINGS.instagram,
      tiles: DEFAULT_SETTINGS.instagram.tiles.map((t) => ({ ...t })),
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
