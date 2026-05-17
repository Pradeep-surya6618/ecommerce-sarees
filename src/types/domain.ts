export type ProductStatus = "draft" | "active" | "archived";

export interface ProductVariant {
  sku: string;
  colorName: string;
  colorHex: string;
  size?: string;
  stock: number;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  priceInPaise: number;
  mrpInPaise: number;
  images: ProductImage[];
  variants: ProductVariant[];
  tags: string[];
  fabric: string;
  occasion: string[];
  status: ProductStatus;
  featured: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  parentSlug: string | null;
  sortOrder: number;
}

export type BannerPlacement = "home-hero" | "home-strip" | "shop-strip";

export interface Banner {
  id: string;
  placement: BannerPlacement;
  imageUrl: string;
  imageAlt: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  sortOrder: number;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string | null;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  body: string;
  createdAt: string;
  verifiedPurchase: boolean;
}

export interface Address {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: "IN";
}

export interface CartItem {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantSku: string;
  variantLabel: string;
  imageUrl: string;
  unitPricePaise: number;
  unitMrpPaise: number;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  id: string;
  userId: string | null;
  guestSessionId: string | null;
  items: CartItem[];
  updatedAt: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  etaDays: number;
  pricePaise: number;
}

export type PaymentMethod = "razorpay" | "cod";

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "payment_failed";

export interface OrderItem {
  productId: string;
  productSlug: string;
  productName: string;
  variantSku: string;
  variantLabel: string;
  imageUrl: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

export interface Order {
  id: string;
  userId: string | null;
  guestSessionId: string | null;
  items: OrderItem[];
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "failed";
  shippingAddress: Address;
  shippingOption: ShippingOption;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}
