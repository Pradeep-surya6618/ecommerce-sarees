import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetOrdersRepo, ordersRepo } from "@/lib/db/repos/orders";
import type { User } from "@/types/domain";
import { addOrderNoteAction, refundOrderAction, updateOrderStatusAction } from "./admin-orders";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

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

describe("admin-orders server actions", () => {
  let orderId: string;

  beforeEach(async () => {
    __resetOrdersRepo();
    getCurrentUserMock.mockReset();
    getCurrentUserMock.mockResolvedValue(adminUser);

    // Create a seed order for each test
    const order = await ordersRepo.create({
      userId: "usr_cust",
      guestSessionId: null,
      items: [],
      subtotalPaise: 100000,
      shippingPaise: 0,
      taxPaise: 0,
      totalPaise: 100000,
      paymentMethod: "cod",
      shippingAddress: {
        fullName: "Test User",
        phone: "9999999999",
        email: "test@example.com",
        line1: "123 Main St",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "IN",
      },
      shippingOption: { id: "standard", name: "Standard", pricePaise: 0, etaDays: 5 },
    });
    orderId = order.id;
  });

  it("admin can update order status and add a note", async () => {
    await updateOrderStatusAction(orderId, "shipped");
    const after = await ordersRepo.getById(orderId);
    expect(after?.status).toBe("shipped");

    await addOrderNoteAction(orderId, "Dispatched via Blue Dart");
    const withNote = await ordersRepo.getById(orderId);
    expect(withNote?.internalNotes).toHaveLength(1);
    expect(withNote?.internalNotes[0]?.body).toBe("Dispatched via Blue Dart");
    expect(withNote?.internalNotes[0]?.authorId).toBe("usr_admin");
  });

  it("refundOrderAction sets status to cancelled", async () => {
    await refundOrderAction(orderId);
    const after = await ordersRepo.getById(orderId);
    expect(after?.status).toBe("cancelled");
  });

  it("all actions throw 'Admin access required' when user is a customer", async () => {
    getCurrentUserMock.mockResolvedValue(customerUser);

    await expect(updateOrderStatusAction(orderId, "shipped")).rejects.toThrow(
      /Admin access required/,
    );
    await expect(refundOrderAction(orderId)).rejects.toThrow(/Admin access required/);
    await expect(addOrderNoteAction(orderId, "note")).rejects.toThrow(/Admin access required/);
  });
});
