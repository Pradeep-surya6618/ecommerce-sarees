import { beforeEach, describe, expect, it } from "vitest";
import { __resetAddressesRepo, addressesRepo } from "./addresses";

const sample = {
  userId: "usr_x",
  fullName: "Aishwarya R.",
  phone: "9876543210",
  email: "a@example.com",
  line1: "1 Anna Salai",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600002",
  country: "IN" as const,
};

describe("addressesRepo (mock)", () => {
  beforeEach(() => __resetAddressesRepo());

  it("creates the first address as default automatically", async () => {
    const a = await addressesRepo.create(sample);
    expect(a.id).toMatch(/^addr_/);
    expect(a.isDefault).toBe(true);
  });

  it("subsequent creates are not default by default", async () => {
    await addressesRepo.create(sample);
    const b = await addressesRepo.create({ ...sample, line1: "2 Mount Rd" });
    expect(b.isDefault).toBe(false);
  });

  it("setDefault flips the flag and unsets the previous default", async () => {
    const a = await addressesRepo.create(sample);
    const b = await addressesRepo.create({ ...sample, line1: "2 Mount Rd" });
    await addressesRepo.setDefault("usr_x", b.id);
    const list = await addressesRepo.listByUser("usr_x");
    expect(list.find((x) => x.id === a.id)?.isDefault).toBe(false);
    expect(list.find((x) => x.id === b.id)?.isDefault).toBe(true);
  });

  it("updates an address", async () => {
    const a = await addressesRepo.create(sample);
    const updated = await addressesRepo.update(a.id, { label: "Home", city: "Mumbai" });
    expect(updated?.label).toBe("Home");
    expect(updated?.city).toBe("Mumbai");
  });

  it("deletes an address; if it was default, promotes another", async () => {
    const a = await addressesRepo.create(sample);
    const b = await addressesRepo.create({ ...sample, line1: "2 Mount Rd" });
    await addressesRepo.delete(a.id);
    const list = await addressesRepo.listByUser("usr_x");
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(b.id);
    expect(list[0]?.isDefault).toBe(true);
  });
});
