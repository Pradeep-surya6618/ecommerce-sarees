import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { Cart, CartItem } from "@/types/domain";

export interface AddItemInput {
  productId: string;
  productSlug: string;
  productName: string;
  variantSku: string;
  variantLabel: string;
  imageUrl: string;
  unitPricePaise: number;
  unitMrpPaise: number;
  quantity: number;
}

export interface CartRepo {
  getOrCreateForGuestSession(guestSessionId: string): Promise<Cart>;
  getOrCreateForUser(userId: string): Promise<Cart>;
  addItem(guestSessionId: string, input: AddItemInput): Promise<Cart>;
  addItemAsUser(userId: string, input: AddItemInput): Promise<Cart>;
  updateQuantity(guestSessionId: string, itemId: string, quantity: number): Promise<Cart>;
  updateQuantityAsUser(userId: string, itemId: string, quantity: number): Promise<Cart>;
  removeItem(guestSessionId: string, itemId: string): Promise<Cart>;
  removeItemAsUser(userId: string, itemId: string): Promise<Cart>;
  clear(guestSessionId: string): Promise<Cart>;
  clearAsUser(userId: string): Promise<Cart>;
  mergeGuestIntoUser(guestSessionId: string, userId: string): Promise<Cart>;
}

// Carts table layout:
//   PK = cartId
//   GSI UserIndex   (userId)          → find a logged-in user's cart
//   GSI SessionIndex (guestSessionId) → find a guest's cart
//   TTL on `expiresAt` (epoch seconds)
//
// Items are embedded as an array attribute on the cart row — every mutation
// rewrites the whole cart, which is fine because items count is small (single
// digit to maybe a few dozen).

const GUEST_TTL_DAYS = 30; // anonymous browsers — short
const USER_TTL_DAYS = 90; // signed-in users — longer
const SECONDS_PER_DAY = 60 * 60 * 24;

function table(): string {
  return tableName(TABLES.Carts);
}

function nowIso(): string {
  return new Date().toISOString();
}

function expiresAtFor(cart: Pick<Cart, "userId">): number {
  const days = cart.userId ? USER_TTL_DAYS : GUEST_TTL_DAYS;
  return Math.floor(Date.now() / 1000) + days * SECONDS_PER_DAY;
}

// `userId` and `guestSessionId` back GSIs. DDB rejects NULL as a GSI key
// value, so we omit them entirely when null. fromItem patches them back to
// null so the domain type stays consistent.
function toItem(cart: Cart): Record<string, unknown> {
  const item: Record<string, unknown> = {
    cartId: cart.id,
    items: cart.items,
    updatedAt: cart.updatedAt,
    expiresAt: expiresAtFor(cart),
  };
  if (cart.userId) item.userId = cart.userId;
  if (cart.guestSessionId) item.guestSessionId = cart.guestSessionId;
  return item;
}

function fromItem(row: Record<string, unknown> | undefined): Cart | null {
  if (!row) return null;
  const r = row as {
    cartId: string;
    userId?: string;
    guestSessionId?: string;
    items: Cart["items"];
    updatedAt: string;
  };
  return {
    id: r.cartId,
    userId: r.userId ?? null,
    guestSessionId: r.guestSessionId ?? null,
    items: r.items,
    updatedAt: r.updatedAt,
  };
}

async function getByCartId(cartId: string): Promise<Cart | null> {
  const res = await getDdbDoc().send(new GetCommand({ TableName: table(), Key: { cartId } }));
  return fromItem(res.Item);
}

async function findByUserId(userId: string): Promise<Cart | null> {
  const res = await getDdbDoc().send(
    new QueryCommand({
      TableName: table(),
      IndexName: "UserIndex",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
      Limit: 1,
    }),
  );
  return fromItem(res.Items?.[0]);
}

async function findByGuestSession(guestSessionId: string): Promise<Cart | null> {
  const res = await getDdbDoc().send(
    new QueryCommand({
      TableName: table(),
      IndexName: "SessionIndex",
      KeyConditionExpression: "guestSessionId = :s",
      ExpressionAttributeValues: { ":s": guestSessionId },
      Limit: 1,
    }),
  );
  return fromItem(res.Items?.[0]);
}

async function saveCart(cart: Cart): Promise<Cart> {
  await getDdbDoc().send(new PutCommand({ TableName: table(), Item: toItem(cart) }));
  return cart;
}

async function ensureGuestCart(guestSessionId: string): Promise<Cart> {
  const existing = await findByGuestSession(guestSessionId);
  if (existing) return existing;
  const cart: Cart = {
    id: `cart_${nanoid(12)}`,
    userId: null,
    guestSessionId,
    items: [],
    updatedAt: nowIso(),
  };
  return saveCart(cart);
}

async function ensureUserCart(userId: string): Promise<Cart> {
  const existing = await findByUserId(userId);
  if (existing) return existing;
  const cart: Cart = {
    id: `cart_${nanoid(12)}`,
    userId,
    guestSessionId: null,
    items: [],
    updatedAt: nowIso(),
  };
  return saveCart(cart);
}

function addOrMergeItem(target: Cart, input: AddItemInput): Cart {
  const existing = target.items.find((i) => i.variantSku === input.variantSku);
  let items: CartItem[];
  if (existing) {
    items = target.items.map((i) =>
      i.variantSku === input.variantSku ? { ...i, quantity: i.quantity + input.quantity } : i,
    );
  } else {
    const newItem: CartItem = {
      id: `ci_${nanoid(10)}`,
      productId: input.productId,
      productSlug: input.productSlug,
      productName: input.productName,
      variantSku: input.variantSku,
      variantLabel: input.variantLabel,
      imageUrl: input.imageUrl,
      unitPricePaise: input.unitPricePaise,
      unitMrpPaise: input.unitMrpPaise,
      quantity: input.quantity,
      addedAt: nowIso(),
    };
    items = [...target.items, newItem];
  }
  return { ...target, items, updatedAt: nowIso() };
}

function setItemQuantity(cart: Cart, itemId: string, quantity: number): Cart {
  const exists = cart.items.some((i) => i.id === itemId);
  if (!exists) return cart;
  const items =
    quantity <= 0
      ? cart.items.filter((i) => i.id !== itemId)
      : cart.items.map((i) => (i.id === itemId ? { ...i, quantity } : i));
  return { ...cart, items, updatedAt: nowIso() };
}

function withoutItem(cart: Cart, itemId: string): Cart {
  return { ...cart, items: cart.items.filter((i) => i.id !== itemId), updatedAt: nowIso() };
}

function emptied(cart: Cart): Cart {
  return { ...cart, items: [], updatedAt: nowIso() };
}

export const cartRepo: CartRepo = {
  async getOrCreateForGuestSession(guestSessionId) {
    return ensureGuestCart(guestSessionId);
  },

  async getOrCreateForUser(userId) {
    return ensureUserCart(userId);
  },

  async addItem(guestSessionId, input) {
    const cart = await ensureGuestCart(guestSessionId);
    return saveCart(addOrMergeItem(cart, input));
  },

  async addItemAsUser(userId, input) {
    const cart = await ensureUserCart(userId);
    return saveCart(addOrMergeItem(cart, input));
  },

  async updateQuantity(guestSessionId, itemId, quantity) {
    const cart = await ensureGuestCart(guestSessionId);
    return saveCart(setItemQuantity(cart, itemId, quantity));
  },

  async updateQuantityAsUser(userId, itemId, quantity) {
    const cart = await ensureUserCart(userId);
    return saveCart(setItemQuantity(cart, itemId, quantity));
  },

  async removeItem(guestSessionId, itemId) {
    const cart = await ensureGuestCart(guestSessionId);
    return saveCart(withoutItem(cart, itemId));
  },

  async removeItemAsUser(userId, itemId) {
    const cart = await ensureUserCart(userId);
    return saveCart(withoutItem(cart, itemId));
  },

  async clear(guestSessionId) {
    const cart = await ensureGuestCart(guestSessionId);
    return saveCart(emptied(cart));
  },

  async clearAsUser(userId) {
    const cart = await ensureUserCart(userId);
    return saveCart(emptied(cart));
  },

  async mergeGuestIntoUser(guestSessionId, userId) {
    const [guest, user] = await Promise.all([
      findByGuestSession(guestSessionId),
      ensureUserCart(userId),
    ]);
    if (!guest || guest.items.length === 0) return user;

    let merged = user;
    for (const item of guest.items) {
      merged = addOrMergeItem(merged, {
        productId: item.productId,
        productSlug: item.productSlug,
        productName: item.productName,
        variantSku: item.variantSku,
        variantLabel: item.variantLabel,
        imageUrl: item.imageUrl,
        unitPricePaise: item.unitPricePaise,
        unitMrpPaise: item.unitMrpPaise,
        quantity: item.quantity,
      });
    }
    await saveCart(merged);
    // Delete the guest row — once merged it has no purpose. (TTL would
    // eventually evict it but deleting now keeps the table clean and avoids
    // a stale guest cart re-appearing if the same cookie is reused.)
    await getDdbDoc().send(new DeleteCommand({ TableName: table(), Key: { cartId: guest.id } }));
    return merged;
  },
};

// Retained for any leftover test imports — no-op now that the repo lives in
// DynamoDB. Use the dynamo-teardown scripts to clear real data.
export function __resetCartRepo(): void {
  // intentional no-op
}

// Re-export for direct lookups (used by guest-session tests, etc.).
export { getByCartId };
