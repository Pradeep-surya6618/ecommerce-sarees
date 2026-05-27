import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type {
  AboutPageContent,
  AnnouncementSettings,
  InstagramSettings,
  SiteSettings,
  SocialLinks,
  StoreProfileSettings,
  VisitSettings,
} from "@/types/domain";

// Site settings is a singleton in the Content table.
//   PK = "SETTINGS#GLOBAL"
//   SK = "META"
// The admin populates this via /admin/settings, /admin/about, /admin/instagram.
const SETTINGS_PK = "SETTINGS#GLOBAL";

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

const EMPTY_SOCIAL: SocialLinks = {
  instagram: "",
  facebook: "",
  pinterest: "",
  youtube: "",
  whatsapp: "",
};

const EMPTY_VISIT: VisitSettings = {
  addressLine1: "",
  addressLine2: "",
  hours: "",
  href: "",
};

const EMPTY_STORE_PROFILE: StoreProfileSettings = {
  legalName: "",
  tradeName: "",
  gstNumber: "",
  pan: "",
  address: "",
  email: "",
  phone: "",
  wholesaleEmail: "",
};

const DEFAULT_SETTINGS: SiteSettings = {
  announcement: { message: "", enabled: false },
  about: EMPTY_ABOUT,
  instagram: EMPTY_INSTAGRAM,
  social: EMPTY_SOCIAL,
  visit: EMPTY_VISIT,
  storeProfile: EMPTY_STORE_PROFILE,
};

export interface SiteSettingsRepo {
  get(): Promise<SiteSettings>;
  updateAnnouncement(input: AnnouncementSettings): Promise<SiteSettings>;
  updateAbout(input: AboutPageContent): Promise<SiteSettings>;
  updateInstagram(input: InstagramSettings): Promise<SiteSettings>;
  updateSocial(input: SocialLinks): Promise<SiteSettings>;
  updateVisit(input: VisitSettings): Promise<SiteSettings>;
  updateStoreProfile(input: StoreProfileSettings): Promise<SiteSettings>;
}

function table(): string {
  return tableName(TABLES.Content);
}

interface SettingsItem extends SiteSettings {
  pk: string;
  sk: string;
  entity: "settings";
}

function toItem(settings: SiteSettings): SettingsItem {
  return { ...settings, pk: SETTINGS_PK, sk: "META", entity: "settings" };
}

function fromItem(item: Record<string, unknown> | undefined): SiteSettings | null {
  if (!item) return null;
  if ((item as { entity?: string }).entity !== "settings") return null;
  const { pk: _pk, sk: _sk, entity: _e, ...rest } = item as SettingsItem;
  // Backfill missing top-level fields when reading older items. Also migrate
  // the older `contact` block (email/phone/wholesaleEmail) into the new
  // storeProfile shape so admin edits made before this refactor aren't lost.
  const legacyContact = (rest as { contact?: Partial<StoreProfileSettings> }).contact;
  const storeProfile: StoreProfileSettings = rest.storeProfile
    ? rest.storeProfile
    : {
        ...DEFAULT_SETTINGS.storeProfile,
        ...(legacyContact ?? {}),
      };
  return {
    announcement: rest.announcement ?? DEFAULT_SETTINGS.announcement,
    about: rest.about ?? DEFAULT_SETTINGS.about,
    instagram: rest.instagram ?? DEFAULT_SETTINGS.instagram,
    social: rest.social ?? DEFAULT_SETTINGS.social,
    visit: rest.visit ?? DEFAULT_SETTINGS.visit,
    storeProfile,
  };
}

async function load(): Promise<SiteSettings> {
  const res = await getDdbDoc().send(
    new GetCommand({
      TableName: table(),
      Key: { pk: SETTINGS_PK, sk: "META" },
    }),
  );
  return fromItem(res.Item) ?? { ...DEFAULT_SETTINGS };
}

async function save(settings: SiteSettings): Promise<SiteSettings> {
  await getDdbDoc().send(
    new PutCommand({
      TableName: table(),
      Item: toItem(settings),
    }),
  );
  return settings;
}

export const siteSettingsRepo: SiteSettingsRepo = {
  async get() {
    return load();
  },

  async updateAnnouncement(input) {
    const current = await load();
    const next: SiteSettings = {
      ...current,
      announcement: { message: input.message, enabled: input.enabled },
    };
    return save(next);
  },

  async updateAbout(input) {
    const current = await load();
    const next: SiteSettings = { ...current, about: { ...input } };
    return save(next);
  },

  async updateInstagram(input) {
    const current = await load();
    const next: SiteSettings = {
      ...current,
      instagram: {
        handle: input.handle,
        ctaHref: input.ctaHref,
        enabled: input.enabled,
        tiles: input.tiles.map((t) => ({ ...t })),
      },
    };
    return save(next);
  },

  async updateSocial(input) {
    const current = await load();
    const next: SiteSettings = { ...current, social: { ...input } };
    return save(next);
  },

  async updateVisit(input) {
    const current = await load();
    const next: SiteSettings = { ...current, visit: { ...input } };
    return save(next);
  },

  async updateStoreProfile(input) {
    const current = await load();
    const next: SiteSettings = { ...current, storeProfile: { ...input } };
    return save(next);
  },
};
