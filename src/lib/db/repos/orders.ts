import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
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
  /** Razorpay's order id — only present for online-payment orders. */
  razorpayOrderId?: string;
  /** Overrides the default initial status. Online payments start as
   *  "pending_payment" until the signature verifies. */
  initialStatus?: OrderStatus;
}

export interface OrdersRepo {
  create(input: CreateOrderInput): Promise<Order>;
  getById(id: string): Promise<Order | null>;
  listByGuestSession(guestSessionId: string): Promise<Order[]>;
  listByUser(userId: string): Promise<Order[]>;
  listAll(): Promise<Order[]>;
  listByStatus(status: OrderStatus): Promise<Order[]>;
  updateStatus(orderId: string, status: OrderStatus): Promise<Order | null>;
  /** Mark an order as paid after Razorpay signature verification.
   *  Idempotent: if already paid, returns the existing order unchanged. */
  markPaid(orderId: string, razorpayPaymentId: string): Promise<Order | null>;
  /** Flag a failed/cancelled online payment so admin sees it + customer can retry. */
  markPaymentFailed(orderId: string): Promise<Order | null>;
  /** Attach the Razorpay order id to a pending DDB order — used during the
   *  create flow so we can use our own order id as Razorpay's receipt. */
  setRazorpayOrderId(orderId: string, razorpayOrderId: string): Promise<Order | null>;
  addInternalNote(
    orderId: string,
    note: { authorId: string; authorName: string; body: string },
  ): Promise<Order | null>;
}

// DynamoDB Orders table:
//   PK = orderId
//   GSI UserCreatedIndex(userId, createdAt)     → "my orders" + admin user view
//   GSI StatusCreatedIndex(status, createdAt)   → admin filter by status

function table(): string {
  return tableName(TABLES.Orders);
}

function nowIso(): string {
  return new Date().toISOString();
}

function toItem(order: Order): Record<string, unknown> {
  return { ...order, orderId: order.id };
}

function fromItem(item: Record<string, unknown> | undefined): Order | null {
  if (!item) return null;
  const { orderId, ...rest } = item as Order & { orderId: string };
  return { ...(rest as Order), id: orderId };
}

async function scanAll(): Promise<Order[]> {
  const out: Order[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await getDdbDoc().send(
      new ScanCommand({ TableName: table(), ExclusiveStartKey: lastKey }),
    );
    for (const item of res.Items ?? []) {
      const order = fromItem(item);
      if (order) out.push(order);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
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
      // Online payments stay in "pending_payment" until the signature verifies;
      // COD orders are confirmed immediately and the cash settles at delivery.
      status:
        input.initialStatus ??
        (input.paymentMethod === "razorpay" ? "pending_payment" : "confirmed"),
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      ...(input.razorpayOrderId ? { razorpayOrderId: input.razorpayOrderId } : {}),
      shippingAddress: input.shippingAddress,
      shippingOption: input.shippingOption,
      customerNotes: input.customerNotes,
      internalNotes: [],
      createdAt: now,
      updatedAt: now,
    };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(order),
        ConditionExpression: "attribute_not_exists(orderId)",
      }),
    );
    return order;
  },

  async getById(id) {
    const res = await getDdbDoc().send(
      new GetCommand({ TableName: table(), Key: { orderId: id } }),
    );
    return fromItem(res.Item);
  },

  async listByGuestSession(guestSessionId) {
    // Guest orders don't have a GSI — admin queries them by userId=null path
    // which is rare. Scan + filter is acceptable until we add a GuestSessionIndex.
    const all = await scanAll();
    return all
      .filter((o) => o.guestSessionId === guestSessionId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async listByUser(userId) {
    const out: Order[] = [];
    let lastKey: Record<string, unknown> | undefined;
    do {
      const res = await getDdbDoc().send(
        new QueryCommand({
          TableName: table(),
          IndexName: "UserCreatedIndex",
          KeyConditionExpression: "userId = :u",
          ExpressionAttributeValues: { ":u": userId },
          ScanIndexForward: false, // newest first
          ExclusiveStartKey: lastKey,
        }),
      );
      for (const item of res.Items ?? []) {
        const order = fromItem(item);
        if (order) out.push(order);
      }
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    return out;
  },

  async listAll() {
    const all = await scanAll();
    return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async listByStatus(status) {
    const out: Order[] = [];
    let lastKey: Record<string, unknown> | undefined;
    do {
      const res = await getDdbDoc().send(
        new QueryCommand({
          TableName: table(),
          IndexName: "StatusCreatedIndex",
          KeyConditionExpression: "#s = :s",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: { ":s": status },
          ScanIndexForward: false,
          ExclusiveStartKey: lastKey,
        }),
      );
      for (const item of res.Items ?? []) {
        const order = fromItem(item);
        if (order) out.push(order);
      }
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    return out;
  },

  async updateStatus(orderId, status) {
    try {
      const res = await getDdbDoc().send(
        new UpdateCommand({
          TableName: table(),
          Key: { orderId },
          UpdateExpression: "SET #s = :s, updatedAt = :u",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: { ":s": status, ":u": nowIso() },
          ConditionExpression: "attribute_exists(orderId)",
          ReturnValues: "ALL_NEW",
        }),
      );
      return fromItem(res.Attributes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ConditionalCheckFailed")) return null;
      throw err;
    }
  },

  // Idempotent: if the order is already paid, returns it unchanged. Lets the
  // verify action and the webhook both safely call this on the same payment.
  async markPaid(orderId, razorpayPaymentId) {
    const existing = await ordersRepo.getById(orderId);
    if (!existing) return null;
    if (existing.paymentStatus === "paid") return existing;
    try {
      const res = await getDdbDoc().send(
        new UpdateCommand({
          TableName: table(),
          Key: { orderId },
          UpdateExpression:
            "SET #s = :s, paymentStatus = :ps, razorpayPaymentId = :pid, updatedAt = :u",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: {
            // Advance the workflow rank to "paid" so the journey timeline ticks
            // forward (Confirmed → Paid). Customers paying via Razorpay reach
            // rank 2 the moment the signature verifies; COD orders stay at
            // "confirmed" (rank 1) until the courier collects the cash.
            ":s": "paid",
            ":ps": "paid",
            ":pid": razorpayPaymentId,
            ":u": nowIso(),
          },
          ConditionExpression: "attribute_exists(orderId)",
          ReturnValues: "ALL_NEW",
        }),
      );
      return fromItem(res.Attributes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ConditionalCheckFailed")) return null;
      throw err;
    }
  },

  async setRazorpayOrderId(orderId, razorpayOrderId) {
    try {
      const res = await getDdbDoc().send(
        new UpdateCommand({
          TableName: table(),
          Key: { orderId },
          UpdateExpression: "SET razorpayOrderId = :r, updatedAt = :u",
          ExpressionAttributeValues: { ":r": razorpayOrderId, ":u": nowIso() },
          ConditionExpression: "attribute_exists(orderId)",
          ReturnValues: "ALL_NEW",
        }),
      );
      return fromItem(res.Attributes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ConditionalCheckFailed")) return null;
      throw err;
    }
  },

  async markPaymentFailed(orderId) {
    try {
      const res = await getDdbDoc().send(
        new UpdateCommand({
          TableName: table(),
          Key: { orderId },
          UpdateExpression: "SET #s = :s, paymentStatus = :ps, updatedAt = :u",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: {
            ":s": "payment_failed",
            ":ps": "failed",
            ":u": nowIso(),
          },
          ConditionExpression: "attribute_exists(orderId)",
          ReturnValues: "ALL_NEW",
        }),
      );
      return fromItem(res.Attributes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ConditionalCheckFailed")) return null;
      throw err;
    }
  },

  async addInternalNote(orderId, note) {
    const newNote: AdminOrderNote = {
      id: `note_${nanoid(10)}`,
      authorId: note.authorId,
      authorName: note.authorName,
      body: note.body,
      createdAt: nowIso(),
    };
    try {
      const res = await getDdbDoc().send(
        new UpdateCommand({
          TableName: table(),
          Key: { orderId },
          UpdateExpression:
            "SET internalNotes = list_append(if_not_exists(internalNotes, :empty), :note), updatedAt = :u",
          ExpressionAttributeValues: {
            ":note": [newNote],
            ":empty": [],
            ":u": nowIso(),
          },
          ConditionExpression: "attribute_exists(orderId)",
          ReturnValues: "ALL_NEW",
        }),
      );
      return fromItem(res.Attributes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ConditionalCheckFailed")) return null;
      throw err;
    }
  },
};
