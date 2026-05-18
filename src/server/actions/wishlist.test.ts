import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetWishlistRepo, wishlistRepo } from "@/lib/db/repos/wishlist";
import { addToWishlistAction, removeFromWishlistAction } from "./wishlist";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const getCurrentUserMock = vi.hoisted(() =>
  vi.fn<() => Promise<{ id: string } | null>>(async () => null),
);
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: getCurrentUserMock }));

const sample = {
  productId: "prd_a",
  productSlug: "p-a",
  productName: "Amrita",
  imageUrl: "https://x/y.jpg",
  priceInPaise: 100000,
  mrpInPaise: 120000,
};

describe("wishlist server actions", () => {
  beforeEach(() => {
    __resetWishlistRepo();
    getCurrentUserMock.mockReset();
    getCurrentUserMock.mockResolvedValue({ id: "usr_wl" });
  });

  it("adds and removes a wishlist item for the current user", async () => {
    await addToWishlistAction(sample);
    expect(await wishlistRepo.has("usr_wl", "prd_a")).toBe(true);
    await removeFromWishlistAction("prd_a");
    expect(await wishlistRepo.has("usr_wl", "prd_a")).toBe(false);
  });

  it("requires a signed-in user", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);
    await expect(addToWishlistAction(sample)).rejects.toThrow(/sign in/i);
  });
});
