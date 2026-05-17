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
  addItem(guestSessionId: string, input: AddItemInput): Promise<Cart>;
  updateQuantity(guestSessionId: string, itemId: string, quantity: number): Promise<Cart>;
  removeItem(guestSessionId: string, itemId: string): Promise<Cart>;
  clear(guestSessionId: string): Promise<Cart>;
}

const carts = new Map<string, Cart>();

function nowIso(): string {
  return new Date().toISOString();
}

function ensureCart(guestSessionId: string): Cart {
  const existing = carts.get(guestSessionId);
  if (existing) return existing;
  const cart: Cart = {
    id: `cart_${nanoid(12)}`,
    userId: null,
    guestSessionId,
    items: [],
    updatedAt: nowIso(),
  };
  carts.set(guestSessionId, cart);
  return cart;
}

export const cartRepo: CartRepo = {
  async getOrCreateForGuestSession(guestSessionId) {
    return ensureCart(guestSessionId);
  },

  async addItem(guestSessionId, input) {
    const cart = ensureCart(guestSessionId);
    const existing = cart.items.find((i) => i.variantSku === input.variantSku);
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
      cart.items.push(item);
    }
    cart.updatedAt = nowIso();
    return cart;
  },

  async updateQuantity(guestSessionId, itemId, quantity) {
    const cart = ensureCart(guestSessionId);
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
    const cart = ensureCart(guestSessionId);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.updatedAt = nowIso();
    return cart;
  },

  async clear(guestSessionId) {
    const cart = ensureCart(guestSessionId);
    cart.items = [];
    cart.updatedAt = nowIso();
    return cart;
  },
};

export function __resetCartRepo(): void {
  carts.clear();
}
