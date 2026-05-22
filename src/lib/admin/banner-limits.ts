import type { Banner } from "@/types/domain";

/** Per-placement upload caps. Hero is a slideshow (more banners help), strips
 *  are single decorative bands so 2 is plenty. */
export const BANNER_LIMITS: Record<Banner["placement"], number> = {
  "home-hero": 4,
  "home-strip": 2,
  "shop-strip": 2,
};

export const PLACEMENT_LABELS: Record<Banner["placement"], string> = {
  "home-hero": "Home hero",
  "home-strip": "Home strip",
  "shop-strip": "Shop strip",
};

export function countByPlacement(banners: Banner[]): Record<Banner["placement"], number> {
  const counts: Record<Banner["placement"], number> = {
    "home-hero": 0,
    "home-strip": 0,
    "shop-strip": 0,
  };
  for (const b of banners) counts[b.placement] += 1;
  return counts;
}
