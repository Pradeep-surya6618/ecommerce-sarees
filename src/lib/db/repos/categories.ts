import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { Category } from "@/types/domain";

export interface CategoryDraft {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  parentSlug: string | null;
  sortOrder: number;
}

export interface CategoryTreeNode {
  parent: Category;
  children: Category[];
}

export interface CategoriesRepo {
  list(): Promise<Category[]>;
  listTopLevel(): Promise<Category[]>;
  listChildren(parentSlug: string): Promise<Category[]>;
  listTree(): Promise<CategoryTreeNode[]>;
  getBySlug(slug: string): Promise<Category | null>;
  getById(id: string): Promise<Category | null>;
  create(input: CategoryDraft): Promise<Category>;
  update(id: string, input: Partial<CategoryDraft>): Promise<Category | null>;
  delete(id: string): Promise<void>;
}

// DynamoDB Categories table:
//   PK = categoryId  (stored as `categoryId` attribute, mapped to/from `id`)
//   GSI SlugIndex: slug → for /shop/<slug> lookup
//
// `parentSlug` is a plain attribute. Children are found by scanning + filtering
// because subcategories are low-volume. If we ever hit hundreds of children
// per parent, add a ParentSlugIndex GSI.

function table(): string {
  return tableName(TABLES.Categories);
}

function toItem(category: Category): Record<string, unknown> {
  return { ...category, categoryId: category.id };
}

function fromItem(item: Record<string, unknown> | undefined): Category | null {
  if (!item) return null;
  const { categoryId, ...rest } = item as Category & { categoryId: string };
  return { ...(rest as Category), id: categoryId };
}

function bySortOrder(a: Category, b: Category): number {
  return a.sortOrder - b.sortOrder;
}

async function scanAll(): Promise<Category[]> {
  const out: Category[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await getDdbDoc().send(
      new ScanCommand({
        TableName: table(),
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of res.Items ?? []) {
      const cat = fromItem(item);
      if (cat) out.push(cat);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

export const categoriesRepo: CategoriesRepo = {
  async list() {
    const items = await scanAll();
    return items.sort(bySortOrder);
  },

  async listTopLevel() {
    const items = await scanAll();
    return items.filter((c) => c.parentSlug === null).sort(bySortOrder);
  },

  async listChildren(parentSlug) {
    const items = await scanAll();
    return items.filter((c) => c.parentSlug === parentSlug).sort(bySortOrder);
  },

  async listTree() {
    const all = await scanAll();
    const parents = all.filter((c) => c.parentSlug === null).sort(bySortOrder);
    return parents.map((parent) => ({
      parent,
      children: all.filter((c) => c.parentSlug === parent.slug).sort(bySortOrder),
    }));
  },

  async getBySlug(slug) {
    const res = await getDdbDoc().send(
      new QueryCommand({
        TableName: table(),
        IndexName: "SlugIndex",
        KeyConditionExpression: "slug = :slug",
        ExpressionAttributeValues: { ":slug": slug },
        Limit: 1,
      }),
    );
    return fromItem(res.Items?.[0]);
  },

  async getById(id) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { categoryId: id },
      }),
    );
    return fromItem(res.Item);
  },

  async create(input) {
    const existing = await categoriesRepo.getBySlug(input.slug);
    if (existing) {
      throw new Error(`A category with slug "${input.slug}" already exists.`);
    }
    const category: Category = {
      id: `cat_${nanoid(12)}`,
      ...input,
    };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(category),
        ConditionExpression: "attribute_not_exists(categoryId)",
      }),
    );
    return category;
  },

  async update(id, input) {
    const existing = await categoriesRepo.getById(id);
    if (!existing) return null;
    if (input.slug && input.slug !== existing.slug) {
      const clash = await categoriesRepo.getBySlug(input.slug);
      if (clash && clash.id !== id) {
        throw new Error(`A category with slug "${input.slug}" already exists.`);
      }
    }
    const updated: Category = { ...existing, ...input };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(updated),
      }),
    );
    return updated;
  },

  async delete(id) {
    await getDdbDoc().send(
      new DeleteCommand({
        TableName: table(),
        Key: { categoryId: id },
      }),
    );
  },
};
