import { nanoid } from "nanoid";
import type {
  Address,
  AdminOrderNote,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  ShippingOption,
} from "@/types/domain";

export interface CreateOrderInput {
  userId: string | null;
  guestSessionId: string | null;
  items: OrderItem[];
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  shippingOption: ShippingOption;
  customerNotes?: string;
}

export interface OrdersRepo {
  create(input: CreateOrderInput): Promise<Order>;
  getById(id: string): Promise<Order | null>;
  listByGuestSession(guestSessionId: string): Promise<Order[]>;
  listByUser(userId: string): Promise<Order[]>;
  listAll(): Promise<Order[]>;
  updateStatus(orderId: string, status: OrderStatus): Promise<Order | null>;
  addInternalNote(
    orderId: string,
    note: { authorId: string; authorName: string; body: string },
  ): Promise<Order | null>;
}

declare global {
  var __mockOrders: Map<string, Order> | undefined;
}

const orders: Map<string, Order> = globalThis.__mockOrders ?? (globalThis.__mockOrders = new Map());

function nowIso(): string {
  return new Date().toISOString();
}

export const ordersRepo: OrdersRepo = {
  async create(input) {
    const now = nowIso();
    const order: Order = {
      id: `ord_${nanoid(12)}`,
      userId: input.userId,
      guestSessionId: input.guestSessionId,
      items: input.items,
      subtotalPaise: input.subtotalPaise,
      shippingPaise: input.shippingPaise,
      taxPaise: input.taxPaise,
      totalPaise: input.totalPaise,
      status: "confirmed",
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      shippingAddress: input.shippingAddress,
      shippingOption: input.shippingOption,
      customerNotes: input.customerNotes,
      internalNotes: [],
      createdAt: now,
      updatedAt: now,
    };
    orders.set(order.id, order);
    return order;
  },

  async getById(id) {
    return orders.get(id) ?? null;
  },

  async listByGuestSession(guestSessionId) {
    return [...orders.values()]
      .filter((o) => o.guestSessionId === guestSessionId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async listByUser(userId) {
    return [...orders.values()]
      .filter((o) => o.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async listAll() {
    return [...orders.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async updateStatus(orderId, status) {
    const order = orders.get(orderId);
    if (!order) return null;
    order.status = status;
    order.updatedAt = nowIso();
    return order;
  },

  async addInternalNote(orderId, note) {
    const order = orders.get(orderId);
    if (!order) return null;
    const newNote: AdminOrderNote = {
      id: `note_${nanoid(10)}`,
      authorId: note.authorId,
      authorName: note.authorName,
      body: note.body,
      createdAt: nowIso(),
    };
    order.internalNotes.push(newNote);
    order.updatedAt = nowIso();
    return order;
  },
};

export function __resetOrdersRepo(): void {
  orders.clear();
}
