import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { Region, RegionInput } from "@/types/domain";

export interface RegionsRepo {
  listAll(): Promise<Region[]>;
  listActive(): Promise<Region[]>;
  getById(id: string): Promise<Region | null>;
  create(input: RegionInput): Promise<Region>;
  update(id: string, input: Partial<RegionInput>): Promise<Region | null>;
  delete(id: string): Promise<void>;
}

// Regions in the Content table.
//   PK = "REGION#<regionId>"
//   SK = "META"
const PK_PREFIX = "REGION#";

function regionPk(id: string): string {
  return `${PK_PREFIX}${id}`;
}

function table(): string {
  return tableName(TABLES.Content);
}

interface RegionItem extends Region {
  pk: string;
  sk: string;
  entity: "region";
}

function toItem(region: Region): RegionItem {
  return { ...region, pk: regionPk(region.id), sk: "META", entity: "region" };
}

function fromItem(item: Record<string, unknown> | undefined): Region | null {
  if (!item) return null;
  if ((item as { entity?: string }).entity !== "region") return null;
  const { pk: _pk, sk: _sk, entity: _e, ...rest } = item as RegionItem;
  return rest as Region;
}

async function scanRegions(): Promise<Region[]> {
  const out: Region[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await getDdbDoc().send(
      new ScanCommand({
        TableName: table(),
        FilterExpression: "entity = :e",
        ExpressionAttributeValues: { ":e": "region" },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of res.Items ?? []) {
      const region = fromItem(item);
      if (region) out.push(region);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

function bySortOrder(a: Region, b: Region): number {
  return a.sortOrder - b.sortOrder;
}

export const regionsRepo: RegionsRepo = {
  async listAll() {
    return (await scanRegions()).sort(bySortOrder);
  },

  async listActive() {
    return (await scanRegions()).filter((r) => r.active).sort(bySortOrder);
  },

  async getById(id) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { pk: regionPk(id), sk: "META" },
      }),
    );
    return fromItem(res.Item);
  },

  async create(input) {
    const region: Region = {
      id: `rgn_${nanoid(10)}`,
      state: input.state,
      craft: input.craft,
      href: input.href,
      imageUrl: input.imageUrl,
      sortOrder: input.sortOrder,
      active: input.active,
    };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(region),
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
    return region;
  },

  async update(id, input) {
    const existing = await regionsRepo.getById(id);
    if (!existing) return null;
    const updated: Region = { ...existing, ...input };
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
        Key: { pk: regionPk(id), sk: "META" },
      }),
    );
  },
};
