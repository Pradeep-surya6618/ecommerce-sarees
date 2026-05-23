import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import type { Banner, BannerInput, BannerPlacement } from "@/types/domain";

export interface BannersRepo {
  listByPlacement(placement: BannerPlacement): Promise<Banner[]>;
  listAll(): Promise<Banner[]>;
  getById(id: string): Promise<Banner | null>;
  create(input: BannerInput): Promise<Banner>;
  update(id: string, input: Partial<BannerInput>): Promise<Banner | null>;
  delete(id: string): Promise<void>;
}

// Banners in the Content table:
//   PK = "BANNER#<bannerId>"
//   SK = "META"
//   GSI1: gsi1pk="BANNER#PLACEMENT#<placement>", gsi1sk=<sortOrder padded>
const PK_PREFIX = "BANNER#";

function bannerPk(id: string): string {
  return `${PK_PREFIX}${id}`;
}

function bannerGsi1Pk(placement: BannerPlacement): string {
  return `BANNER#PLACEMENT#${placement}`;
}

function sortOrderToSk(order: number): string {
  // Pad so lexicographic order matches numeric order (sortOrder is always
  // small, but pad to 8 digits to keep room).
  return order.toString().padStart(8, "0");
}

function table(): string {
  return tableName(TABLES.Content);
}

interface BannerItem extends Banner {
  pk: string;
  sk: string;
  gsi1pk: string;
  gsi1sk: string;
  entity: "banner";
}

function toItem(banner: Banner): BannerItem {
  return {
    ...banner,
    pk: bannerPk(banner.id),
    sk: "META",
    gsi1pk: bannerGsi1Pk(banner.placement),
    gsi1sk: sortOrderToSk(banner.sortOrder),
    entity: "banner",
  };
}

function fromItem(item: Record<string, unknown> | undefined): Banner | null {
  if (!item) return null;
  if ((item as { entity?: string }).entity !== "banner") return null;
  const { pk: _pk, sk: _sk, gsi1pk: _gp, gsi1sk: _gs, entity: _e, ...rest } = item as BannerItem;
  return rest as Banner;
}

async function scanBanners(): Promise<Banner[]> {
  const out: Banner[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await getDdbDoc().send(
      new ScanCommand({
        TableName: table(),
        FilterExpression: "entity = :e",
        ExpressionAttributeValues: { ":e": "banner" },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of res.Items ?? []) {
      const banner = fromItem(item);
      if (banner) out.push(banner);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

export const bannersRepo: BannersRepo = {
  async listByPlacement(placement) {
    const all = await scanBanners();
    return all
      .filter((b) => b.active && b.placement === placement)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async listAll() {
    const all = await scanBanners();
    return all.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getById(id) {
    const res = await getDdbDoc().send(
      new GetCommand({
        TableName: table(),
        Key: { pk: bannerPk(id), sk: "META" },
      }),
    );
    return fromItem(res.Item);
  },

  async create(input) {
    const banner: Banner = {
      id: `bnr_${nanoid(10)}`,
      placement: input.placement,
      imageUrl: input.imageUrl,
      imageAlt: input.imageAlt,
      title: input.title,
      subtitle: input.subtitle,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
      sortOrder: input.sortOrder,
      active: input.active,
    };
    await getDdbDoc().send(
      new PutCommand({
        TableName: table(),
        Item: toItem(banner),
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
    return banner;
  },

  async update(id, input) {
    const existing = await bannersRepo.getById(id);
    if (!existing) return null;
    const updated: Banner = { ...existing, ...input };
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
        Key: { pk: bannerPk(id), sk: "META" },
      }),
    );
  },
};
