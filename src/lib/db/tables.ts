import { env } from "@/lib/env";

export const TABLES = {
  Users: "Users",
  Categories: "Categories",
  Products: "Products",
  Carts: "Carts",
  Orders: "Orders",
  Ephemeral: "Ephemeral",
  Content: "Content",
} as const;

export type LogicalTable = (typeof TABLES)[keyof typeof TABLES];

export function tableName(name: LogicalTable): string {
  return `${env.DDB_TABLE_PREFIX}${name}`;
}
