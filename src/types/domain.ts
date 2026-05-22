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

/** Saree-specific specifications shown on the product detail page.
 *  All optional — when a field is empty, the storefront falls back to a
 *  value derived from variants/tags/fabric. */
export interface ProductSpecifications {
  zariType?: string;
  zariColor?: string;
  pattern?: string;
  borderType?: string;
  ornamentation?: string;
  blouseType?: string;
  washType?: string;
  deliveryTime?: string;
  weight?: string;
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
  specifications?: ProductSpecifications;
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
  internalNotes: AdminOrderNote[];
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "customer" | "staff" | "admin";

export type AuthProvider = "email" | "google";

export interface User {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  emailVerified: boolean;
  role: UserRole;
  provider: AuthProvider;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDraft {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  priceInPaise: number;
  mrpInPaise: number;
  images: ProductImage[];
  variants: ProductVariant[];
  tags: string[];
  fabric: string;
  occasion: string[];
  featured: boolean;
  status: ProductStatus;
  specifications?: ProductSpecifications;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export type OtpPurpose = "signup" | "password-reset";

export interface OtpRecord {
  id: string;
  email: string;
  purpose: OtpPurpose;
  code: string;
  expiresAt: string;
  consumedAt: string | null;
}

export interface SavedAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: "IN";
  label?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string;
  priceInPaise: number;
  mrpInPaise: number;
  addedAt: string;
}

export interface AdminOrderNote {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type CouponType = "percent" | "flat";
export type CouponStatus = "active" | "paused";

export interface Coupon {
  code: string;
  description?: string;
  type: CouponType;
  value: number; // percent: 0..100, flat: paise
  minOrderPaise?: number;
  maxDiscountPaise?: number; // cap for percent coupons
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BannerInput {
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

export type NavMenuItemKind = "category" | "custom-link";

export interface NavMenuItem {
  id: string;
  label: string;
  kind: NavMenuItemKind;
  categorySlug: string | null;
  href: string | null;
  parentId: string | null;
  sortOrder: number;
  visible: boolean;
}

export interface NavMenuItemInput {
  label: string;
  kind: NavMenuItemKind;
  categorySlug: string | null;
  href: string | null;
  parentId: string | null;
  sortOrder: number;
  visible: boolean;
}

export interface AnnouncementSettings {
  message: string;
  enabled: boolean;
}

export interface InstagramTile {
  id: string;
  imageUrl: string;
  href: string;
  visible: boolean;
}

export interface InstagramSettings {
  handle: string;
  ctaHref: string;
  enabled: boolean;
  tiles: InstagramTile[];
}

export interface AboutPageContent {
  title: string;
  description: string;
  introBody: string;
  imageUrl: string;
  imageAlt: string;
  beliefHeading: string;
  beliefBody: string;
  teamHeading: string;
  teamBody: string;
}

export interface SiteSettings {
  announcement: AnnouncementSettings;
  about: AboutPageContent;
  instagram: InstagramSettings;
}

export type ContentPageGroup = "help" | "company" | "none";

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  body: string;
  footerLabel: string;
  group: ContentPageGroup;
  sortOrder: number;
  visible: boolean;
  isSystem: boolean;
  /** When set, the footer link points here and the markdown body is unused
   *  (content lives in a dedicated admin editor — e.g. /about, /blog). */
  externalHref: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentPageInput {
  slug: string;
  title: string;
  body: string;
  footerLabel: string;
  group: ContentPageGroup;
  sortOrder: number;
  visible: boolean;
  externalHref: string | null;
}

export type BlogPostStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string; // plain text; paragraphs separated by blank lines
  coverImageUrl: string;
  coverImageAlt: string;
  authorName: string;
  tags: string[];
  status: BlogPostStatus;
  publishedAt: string; // ISO; only meaningful if status === "published"
  createdAt: string;
  updatedAt: string;
}
