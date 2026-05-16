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
