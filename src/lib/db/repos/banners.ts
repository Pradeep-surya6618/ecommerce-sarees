import { nanoid } from "nanoid";
import { BANNERS_FIXTURE } from "@/lib/db/fixtures/banners";
import type { Banner, BannerInput, BannerPlacement } from "@/types/domain";

export interface BannersRepo {
  listByPlacement(placement: BannerPlacement): Promise<Banner[]>;
  listAll(): Promise<Banner[]>;
  getById(id: string): Promise<Banner | null>;
  create(input: BannerInput): Promise<Banner>;
  update(id: string, input: Partial<BannerInput>): Promise<Banner | null>;
  delete(id: string): Promise<void>;
}

declare global {
  var __mockBanners: Map<string, Banner> | undefined;
}

function getStore(): Map<string, Banner> {
  if (globalThis.__mockBanners) return globalThis.__mockBanners;
  const store = new Map<string, Banner>();
  for (const b of BANNERS_FIXTURE) store.set(b.id, b);
  globalThis.__mockBanners = store;
  return store;
}

export const bannersRepo: BannersRepo = {
  async listByPlacement(placement) {
    return [...getStore().values()]
      .filter((b) => b.active && b.placement === placement)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async listAll() {
    return [...getStore().values()].sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getById(id) {
    return getStore().get(id) ?? null;
  },

  async create(input) {
    const store = getStore();
    const banner: Banner = {
      id: `bnr_${nanoid(10)}`,
      placement: input.placement,
      imageUrl: input.imageUrl,
      imageAlt: input.imageAlt,
      title: input.title,
      subtitle: input.subtitle,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
      sortOrder: input.sortOrder,
      active: input.active,
    };
    store.set(banner.id, banner);
    return banner;
  },

  async update(id, input) {
    const store = getStore();
    const banner = store.get(id);
    if (!banner) return null;
    Object.assign(banner, input);
    return banner;
  },

  async delete(id) {
    getStore().delete(id);
  },
};

export function __resetBannersRepo(): void {
  globalThis.__mockBanners = undefined;
}
