import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetBannersRepo, bannersRepo } from "@/lib/db/repos/banners";
import type { User } from "@/types/domain";
import { createBannerAction, deleteBannerAction, updateBannerAction } from "./admin-banners";

const redirectMock = vi.hoisted(() =>
  vi.fn((_: string) => {
    throw new Error("NEXT_REDIRECT");
  }),
);

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));

const getCurrentUserMock = vi.hoisted(() =>
  vi.fn<() => Promise<Partial<User> | null>>(async () => null),
);
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: getCurrentUserMock }));

const adminUser: Partial<User> = {
  id: "usr_admin",
  role: "admin",
  email: "admin@example.com",
  fullName: "Demo Admin",
};

const bannerInput = {
  placement: "home-strip" as const,
  imageUrl: "https://example.com/banner.jpg",
  imageAlt: "Sale banner",
  title: "Summer Sale",
  ctaLabel: "Shop Now",
  ctaHref: "/shop",
  sortOrder: 10,
  active: true,
};

describe("admin-banners server actions lifecycle", () => {
  beforeEach(() => {
    __resetBannersRepo();
    redirectMock.mockClear();
    getCurrentUserMock.mockReset();
    getCurrentUserMock.mockResolvedValue(adminUser);
  });

  it("create → update → delete banner full lifecycle", async () => {
    // Create: should redirect to the new banner page
    await expect(createBannerAction(bannerInput)).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith(expect.stringMatching(/^\/admin\/banners\/bnr_/));

    const bannerId = redirectMock.mock.calls[0][0].replace("/admin/banners/", "");
    redirectMock.mockClear();

    // Update: should not redirect
    await updateBannerAction(bannerId, { title: "Winter Sale" });
    const updated = await bannersRepo.getById(bannerId);
    expect(updated?.title).toBe("Winter Sale");
    expect(redirectMock).not.toHaveBeenCalled();

    // Delete: should redirect to the banners list
    await expect(deleteBannerAction(bannerId)).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith("/admin/banners");
    const deleted = await bannersRepo.getById(bannerId);
    expect(deleted).toBeNull();
  });
});
