import { env } from "@/lib/env";

export const TABLES = {
  Users: "Users",
  OtpCodes: "OtpCodes",
  Sessions: "Sessions",
  Categories: "Categories",
  Products: "Products",
  Inventory: "Inventory",
  Carts: "Carts",
  Addresses: "Addresses",
  Orders: "Orders",
  Coupons: "Coupons",
  Banners: "Banners",
  Reviews: "Reviews",
  BlogPosts: "BlogPosts",
  WebhookEvents: "WebhookEvents",
  AdminAuditLog: "AdminAuditLog",
  Settings: "Settings",
  RateLimits: "RateLimits",
} as const;

export type LogicalTable = (typeof TABLES)[keyof typeof TABLES];

export function tableName(name: LogicalTable): string {
  return `${env.DDB_TABLE_PREFIX}${name}`;
}
