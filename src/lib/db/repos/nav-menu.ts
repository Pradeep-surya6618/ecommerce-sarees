import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { NavMenuItem, NavMenuItemInput } from "@/types/domain";

export interface NavMenuTreeNode {
  item: NavMenuItem;
  children: NavMenuItem[];
}

export interface NavMenuRepo {
  list(): Promise<NavMenuItem[]>;
  listTopLevel(): Promise<NavMenuItem[]>;
  listChildren(parentId: string): Promise<NavMenuItem[]>;
  listTree(visibleOnly?: boolean): Promise<NavMenuTreeNode[]>;
  getById(id: string): Promise<NavMenuItem | null>;
  create(input: NavMenuItemInput): Promise<NavMenuItem>;
  update(id: string, input: Partial<NavMenuItemInput>): Promise<NavMenuItem | null>;
  delete(id: string): Promise<void>;
}

// Nav menu items live in the Content table.
//   PK = "NAV#<navId>"
//   SK = "META"
const PK_PREFIX = "NAV#";

function navPk(id: string): string {
  return `${PK_PREFIX}${id}`;
}

function table(): string {
  return tableName(TABLES.Content);
}

interface NavItem extends NavMenuItem {
  pk: string;
  sk: string;
  entity: "nav";
}

function toItem(item: NavMenuItem): NavItem {
  return { ...item, pk: navPk(item.id), sk: "META", entity: "nav" };
}

function fromItem(item: Record<string, unknown> | undefined): NavMenuItem | null {
  if (!item) return null;
  if ((item as { entity?: string }).entity !== "nav") return null;
  const { pk: _pk, sk: _sk, entity: _e, ...rest } = item as NavItem;
  return rest as NavMenuItem;
}

async function scanNav(): Promise<NavMenuItem[]> {
  const out: NavMenuItem[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await getDdbDoc().send(
      new ScanCommand({
        TableName: table(),
        FilterExpression: "entity = :e",
        ExpressionAttributeValues: { ":e": "nav" },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of res.Items ?? []) {
      const nav = fromItem(item);
      if (nav) out.push(nav);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

function bySortOrder(a: NavMenuItem, b: NavMenuItem): number {
  return a.sortOrder - b.sortOrder;
}

export const navMenuRepo: NavMenuRepo = {
  async list() {
    return (await scanNav()).sort(bySortOrder);
  },

  async listTopLevel() {
    return (await scanNav()).filter((i) => i.parentId === null).sort(bySortOrder);
  },

  async listChildren(parentId) {
    return (await scanNav()).filter((i) => i.parentId === parentId).sort(bySortOrder);
  },

  async listTree(visibleOnly = false) {
    const all = await scanNav();
    const filter = visibleOnly ? (i: NavMenuItem) => i.visible : () => true;
    const parents = all.filter((i) => i.parentId === null && filter(i)).sort(bySortOrder);
    return parents.map((item) => ({
      item,
      children: all.filter((c) => c.parentId === item.id && filter(c)).sort(bySortOrder),
    }));
  },

  async getById(id) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { pk: navPk(id), sk: "META" },
      }),
    );
    return fromItem(res.Item);
  },

  async create(input) {
    const item: NavMenuItem = { id: `nav_${nanoid(10)}`, ...input };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(item),
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
    return item;
  },

  async update(id, input) {
    if (input.parentId === id) {
      throw new Error("An item cannot be its own parent.");
    }
    const existing = await navMenuRepo.getById(id);
    if (!existing) return null;
    const updated: NavMenuItem = { ...existing, ...input };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(updated),
      }),
    );
    return updated;
  },

  async delete(id) {
    const all = await scanNav();
    // Cascade: remove children too.
    const toDelete = [id, ...all.filter((i) => i.parentId === id).map((i) => i.id)];
    await Promise.all(
      toDelete.map((targetId) =>
        getDdbDoc().send(
          new DeleteCommand({
            TableName: table(),
            Key: { pk: navPk(targetId), sk: "META" },
          }),
        ),
      ),
    );
  },
};
