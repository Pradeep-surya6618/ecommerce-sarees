import { BANNERS_FIXTURE } from "@/lib/db/fixtures/banners";
import type { Banner, BannerPlacement } from "@/types/domain";

export interface BannersRepo {
  listByPlacement(placement: BannerPlacement): Promise<Banner[]>;
}

export const bannersRepo: BannersRepo = {
  async listByPlacement(placement) {
    return BANNERS_FIXTURE.filter((b) => b.active && b.placement === placement)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
};
