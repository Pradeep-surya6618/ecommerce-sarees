import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetAddressesRepo, addressesRepo } from "@/lib/db/repos/addresses";
import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  updateAddressAction,
} from "./addresses";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const getCurrentUserMock = vi.hoisted(() =>
  vi.fn<() => Promise<{ id: string } | null>>(async () => null),
);
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: getCurrentUserMock }));

const sample = {
  fullName: "Aishwarya R.",
  phone: "9876543210",
  email: "a@example.com",
  line1: "1 Anna Salai",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600002",
  country: "IN" as const,
};

describe("address server actions", () => {
  beforeEach(() => {
    __resetAddressesRepo();
    getCurrentUserMock.mockReset();
    getCurrentUserMock.mockResolvedValue({ id: "usr_addr" });
  });

  it("createAddressAction creates an address for the current user", async () => {
    await createAddressAction(sample);
    const list = await addressesRepo.listByUser("usr_addr");
    expect(list).toHaveLength(1);
    expect(list[0]?.isDefault).toBe(true);
  });

  it("updateAddressAction modifies fields", async () => {
    const created = await addressesRepo.create({ userId: "usr_addr", ...sample });
    await updateAddressAction(created.id, { label: "Home", city: "Bengaluru" });
    const updated = await addressesRepo.getById(created.id);
    expect(updated?.label).toBe("Home");
    expect(updated?.city).toBe("Bengaluru");
  });

  it("setDefaultAddressAction promotes the chosen address", async () => {
    const a = await addressesRepo.create({ userId: "usr_addr", ...sample });
    const b = await addressesRepo.create({
      userId: "usr_addr",
      ...sample,
      line1: "2 Mount Rd",
    });
    await setDefaultAddressAction(b.id);
    const list = await addressesRepo.listByUser("usr_addr");
    expect(list.find((x) => x.id === a.id)?.isDefault).toBe(false);
    expect(list.find((x) => x.id === b.id)?.isDefault).toBe(true);
  });

  it("deleteAddressAction removes the address", async () => {
    const a = await addressesRepo.create({ userId: "usr_addr", ...sample });
    await deleteAddressAction(a.id);
    expect(await addressesRepo.listByUser("usr_addr")).toEqual([]);
  });

  it("throws when no user is signed in", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);
    await expect(createAddressAction(sample)).rejects.toThrow(/sign in/i);
  });

  it("guards updates so a user cannot modify someone else's address", async () => {
    const otherUserAddr = await addressesRepo.create({ userId: "usr_other", ...sample });
    await expect(updateAddressAction(otherUserAddr.id, { city: "X" })).rejects.toThrow(
      /forbidden|not found/i,
    );
  });
});
