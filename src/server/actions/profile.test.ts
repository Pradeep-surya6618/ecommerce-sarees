import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPasswordStub } from "@/lib/auth/passwords";
import { __resetUsersRepo, usersRepo } from "@/lib/db/repos/users";
import { changePasswordAction, updateNameAction } from "./profile";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const getCurrentUserMock = vi.hoisted(() =>
  vi.fn<() => Promise<{ id: string } | null>>(async () => null),
);
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: getCurrentUserMock }));

describe("profile server actions", () => {
  beforeEach(async () => {
    __resetUsersRepo();
    getCurrentUserMock.mockReset();
  });

  it("updateNameAction sets a new full name on the current user", async () => {
    const user = await usersRepo.create({
      email: "n@example.com",
      fullName: "Old Name",
      passwordHash: await hashPasswordStub("x"),
    });
    getCurrentUserMock.mockResolvedValueOnce({ id: user.id });
    await updateNameAction({ fullName: "New Name" });
    const updated = await usersRepo.findById(user.id);
    expect(updated?.fullName).toBe("New Name");
  });

  it("changePasswordAction requires the correct current password", async () => {
    const user = await usersRepo.create({
      email: "c@example.com",
      fullName: "C",
      passwordHash: await hashPasswordStub("Right!23"),
    });
    getCurrentUserMock.mockResolvedValue({ id: user.id });
    await expect(
      changePasswordAction({ currentPassword: "Wrong!23", newPassword: "Hunter22!" }),
    ).rejects.toThrow(/current password/i);

    await changePasswordAction({ currentPassword: "Right!23", newPassword: "Hunter22!" });
    const updated = await usersRepo.findById(user.id);
    expect(updated?.passwordHash).toMatch(/Hunter22!/);
  });
});
