import { nanoid } from "nanoid";
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

declare global {
  var __mockCartsByGuest: Map<string, Cart> | undefined;

  var __mockCartsByUser: Map<string, Cart> | undefined;
}

const cartsByGuest: Map<string, Cart> =
  globalThis.__mockCartsByGuest ?? (globalThis.__mockCartsByGuest = new Map());
const cartsByUser: Map<string, Cart> =
  globalThis.__mockCartsByUser ?? (globalThis.__mockCartsByUser = new Map());

function nowIso(): string {
  return new Date().toISOString();
}

function ensureGuestCart(guestSessionId: string): Cart {
  const existing = cartsByGuest.get(guestSessionId);
  if (existing) return existing;
  const cart: Cart = {
    id: `cart_${nanoid(12)}`,
    userId: null,
    guestSessionId,
    items: [],
    updatedAt: nowIso(),
  };
  cartsByGuest.set(guestSessionId, cart);
  return cart;
}

function ensureUserCart(userId: string): Cart {
  const existing = cartsByUser.get(userId);
  if (existing) return existing;
  const cart: Cart = {
    id: `cart_${nanoid(12)}`,
    userId,
    guestSessionId: null,
    items: [],
    updatedAt: nowIso(),
  };
  cartsByUser.set(userId, cart);
  return cart;
}

function addOrMergeItem(target: Cart, input: AddItemInput): void {
  const existing = target.items.find((i) => i.variantSku === input.variantSku);
  if (existing) {
    existing.quantity += input.quantity;
  } else {
    const item: CartItem = {
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
    target.items.push(item);
  }
  target.updatedAt = nowIso();
}

export const cartRepo: CartRepo = {
  async getOrCreateForGuestSession(guestSessionId) {
    return ensureGuestCart(guestSessionId);
  },

  async getOrCreateForUser(userId) {
    return ensureUserCart(userId);
  },

  async addItem(guestSessionId, input) {
    const cart = ensureGuestCart(guestSessionId);
    addOrMergeItem(cart, input);
    return cart;
  },

  async addItemAsUser(userId, input) {
    const cart = ensureUserCart(userId);
    addOrMergeItem(cart, input);
    return cart;
  },

  async updateQuantity(guestSessionId, itemId, quantity) {
    const cart = ensureGuestCart(guestSessionId);
    const item = cart.items.find((i) => i.id === itemId);
    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter((i) => i.id !== itemId);
      } else {
        item.quantity = quantity;
      }
      cart.updatedAt = nowIso();
    }
    return cart;
  },

  async removeItem(guestSessionId, itemId) {
    const cart = ensureGuestCart(guestSessionId);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.updatedAt = nowIso();
    return cart;
  },

  async updateQuantityAsUser(userId, itemId, quantity) {
    const cart = ensureUserCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter((i) => i.id !== itemId);
      } else {
        item.quantity = quantity;
      }
      cart.updatedAt = nowIso();
    }
    return cart;
  },

  async removeItemAsUser(userId, itemId) {
    const cart = ensureUserCart(userId);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.updatedAt = nowIso();
    return cart;
  },

  async clearAsUser(userId) {
    const cart = ensureUserCart(userId);
    cart.items = [];
    cart.updatedAt = nowIso();
    return cart;
  },

  async clear(guestSessionId) {
    const cart = ensureGuestCart(guestSessionId);
    cart.items = [];
    cart.updatedAt = nowIso();
    return cart;
  },

  async mergeGuestIntoUser(guestSessionId, userId) {
    const guest = cartsByGuest.get(guestSessionId);
    const user = ensureUserCart(userId);
    if (guest) {
      for (const item of guest.items) {
        addOrMergeItem(user, {
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
      guest.items = [];
      guest.updatedAt = nowIso();
    }
    return user;
  },
};

export function __resetCartRepo(): void {
  cartsByGuest.clear();
  cartsByUser.clear();
}
