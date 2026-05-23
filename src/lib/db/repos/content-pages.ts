import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { ContentPage, ContentPageGroup, ContentPageInput } from "@/types/domain";

export interface ContentPagesRepo {
  list(): Promise<ContentPage[]>;
  listVisible(): Promise<ContentPage[]>;
  listByGroup(group: ContentPageGroup): Promise<ContentPage[]>;
  getById(id: string): Promise<ContentPage | null>;
  getBySlug(slug: string): Promise<ContentPage | null>;
  create(input: ContentPageInput): Promise<ContentPage>;
  update(id: string, input: Partial<ContentPageInput>): Promise<ContentPage | null>;
  delete(id: string): Promise<void>;
}

// Content pages live in the Content table.
//   PK = "PAGE#<pageId>"
//   SK = "META"
//   slug attribute = also indexed via the table's SlugIndex GSI
const PK_PREFIX = "PAGE#";

function pagePk(id: string): string {
  return `${PK_PREFIX}${id}`;
}

function table(): string {
  return tableName(TABLES.Content);
}

interface PageItem extends ContentPage {
  pk: string;
  sk: string;
  entity: "page";
}

function toItem(page: ContentPage): PageItem {
  return { ...page, pk: pagePk(page.id), sk: "META", entity: "page" };
}

function fromItem(item: Record<string, unknown> | undefined): ContentPage | null {
  if (!item) return null;
  if ((item as { entity?: string }).entity !== "page") return null;
  const { pk: _pk, sk: _sk, entity: _e, ...rest } = item as PageItem;
  return rest as ContentPage;
}

async function scanPages(): Promise<ContentPage[]> {
  const out: ContentPage[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await getDdbDoc().send(
      new ScanCommand({
        TableName: table(),
        FilterExpression: "entity = :e",
        ExpressionAttributeValues: { ":e": "page" },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of res.Items ?? []) {
      const page = fromItem(item);
      if (page) out.push(page);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

function sortByGroupOrder(a: ContentPage, b: ContentPage): number {
  return a.sortOrder - b.sortOrder;
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

async function findBySlug(slug: string): Promise<ContentPage | null> {
  const all = await scanPages();
  return all.find((p) => p.slug === slug) ?? null;
}

export const contentPagesRepo: ContentPagesRepo = {
  async list() {
    return (await scanPages()).sort(sortByGroupOrder);
  },

  async listVisible() {
    return (await scanPages()).filter((p) => p.visible).sort(sortByGroupOrder);
  },

  async listByGroup(group) {
    return (await scanPages()).filter((p) => p.group === group && p.visible).sort(sortByGroupOrder);
  },

  async getById(id) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { pk: pagePk(id), sk: "META" },
      }),
    );
    return fromItem(res.Item);
  },

  async getBySlug(slug) {
    return findBySlug(slug);
  },

  async create(input) {
    if (!isValidSlug(input.slug)) {
      throw new Error("Slug must be lowercase letters, numbers, and hyphens only.");
    }
    const clash = await findBySlug(input.slug);
    if (clash) {
      throw new Error(`A page with the slug "${input.slug}" already exists.`);
    }
    const now = new Date().toISOString();
    const page: ContentPage = {
      id: `page_${nanoid(10)}`,
      slug: input.slug,
      title: input.title,
      body: input.body,
      footerLabel: input.footerLabel,
      group: input.group,
      sortOrder: input.sortOrder,
      visible: input.visible,
      isSystem: false,
      externalHref: input.externalHref ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(page),
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
    return page;
  },

  async update(id, input) {
    const existing = await contentPagesRepo.getById(id);
    if (!existing) return null;
    if (input.slug !== undefined && input.slug !== existing.slug) {
      if (!isValidSlug(input.slug)) {
        throw new Error("Slug must be lowercase letters, numbers, and hyphens only.");
      }
      const clash = await findBySlug(input.slug);
      if (clash && clash.id !== id) {
        throw new Error(`A page with the slug "${input.slug}" already exists.`);
      }
    }
    const updated: ContentPage = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(updated),
      }),
    );
    return updated;
  },

  async delete(id) {
    const existing = await contentPagesRepo.getById(id);
    if (!existing) return;
    if (existing.isSystem) {
      throw new Error("System pages cannot be deleted. Hide them instead.");
    }
    await getDdbDoc().send(
      new DeleteCommand({
        TableName: table(),
        Key: { pk: pagePk(id), sk: "META" },
      }),
    );
  },
};
