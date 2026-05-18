import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetProductsRepo, productsRepo } from "@/lib/db/repos/products";
import type { ProductDraft, User } from "@/types/domain";
import { archiveProductAction, createProductAction, updateProductAction } from "./admin-products";

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

const customerUser: Partial<User> = {
  id: "usr_cust",
  role: "customer",
  email: "customer@example.com",
  fullName: "Regular Customer",
};

const draftInput: ProductDraft = {
  name: "Test Saree",
  slug: "test-saree",
  description: "A beautiful test saree for testing",
  categorySlug: "kanjivaram",
  priceInPaise: 500000,
  mrpInPaise: 600000,
  images: [{ url: "https://example.com/img.jpg", alt: "Test" }],
  variants: [{ sku: "TST-001", colorName: "Red", colorHex: "#ff0000", stock: 5 }],
  tags: ["test"],
  fabric: "Silk",
  occasion: ["wedding"],
  featured: false,
  status: "active",
};

describe("admin-products server actions", () => {
  beforeEach(() => {
    __resetProductsRepo();
    redirectMock.mockClear();
    getCurrentUserMock.mockReset();
    getCurrentUserMock.mockResolvedValue(adminUser);
  });

  it("createProductAction creates a product and redirects to the edit page", async () => {
    await expect(createProductAction(draftInput)).rejects.toThrow(/NEXT_REDIRECT/);

    const list = await productsRepo.list();
    const created = list.find((p) => p.slug === "test-saree");
    expect(created).toBeDefined();
    expect(created?.id).toMatch(/^prd_/);
    expect(redirectMock).toHaveBeenCalledWith(expect.stringMatching(/^\/admin\/products\/prd_/));
  });

  it("updateProductAction updates product fields without redirecting", async () => {
    const product = await productsRepo.create(draftInput);

    await updateProductAction(product.id, { name: "Updated Saree" });

    const updated = await productsRepo.getById(product.id);
    expect(updated?.name).toBe("Updated Saree");
    expect(updated?.slug).toBe("test-saree");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("archiveProductAction sets status to archived", async () => {
    const product = await productsRepo.create(draftInput);

    await archiveProductAction(product.id);

    const list = await productsRepo.list();
    expect(list.some((p) => p.id === product.id)).toBe(false);
    const all = await productsRepo.listAll({ includeArchived: true });
    const archived = all.find((p) => p.id === product.id);
    expect(archived?.status).toBe("archived");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("all actions throw 'Admin access required' when user is a customer", async () => {
    getCurrentUserMock.mockResolvedValue(customerUser);

    await expect(createProductAction(draftInput)).rejects.toThrow(/Admin access required/);
    await expect(updateProductAction("prd_any", { name: "X" })).rejects.toThrow(
      /Admin access required/,
    );
    await expect(archiveProductAction("prd_any")).rejects.toThrow(/Admin access required/);
  });
});
