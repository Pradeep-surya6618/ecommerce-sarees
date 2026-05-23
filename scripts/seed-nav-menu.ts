import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import { logger } from "@/lib/logger";
import type { NavMenuItem } from "@/types/domain";

// Storefront-wired nav items. These can be renamed / reordered / hidden by
// admins but their route and link kind are locked — admins don't manage
// /shop?sort=newest etc directly.
interface SystemSeed {
  label: string;
  kind: "custom-link";
  href: string;
  sortOrder: number;
  parentLabel: string | null;
}

const SYSTEM_ITEMS: SystemSeed[] = [
  { label: "Shop", kind: "custom-link", href: "/shop", sortOrder: 0, parentLabel: null },
  {
    label: "All sarees",
    kind: "custom-link",
    href: "/shop",
    sortOrder: 0,
    parentLabel: "Shop",
  },
  {
    label: "New arrivals",
    kind: "custom-link",
    href: "/shop?sort=newest",
    sortOrder: 1,
    parentLabel: "Shop",
  },
];

function navPk(id: string): string {
  return `NAV#${id}`;
}

interface NavItemRow extends NavMenuItem {
  pk: string;
  sk: string;
  entity: "nav";
}

function toItem(item: NavMenuItem): NavItemRow {
  return { ...item, pk: navPk(item.id), sk: "META", entity: "nav" };
}

function fromItem(row: Record<string, unknown> | undefined): NavMenuItem | null {
  if (!row) return null;
  if ((row as { entity?: string }).entity !== "nav") return null;
  const { pk: _pk, sk: _sk, entity: _e, ...rest } = row as NavItemRow;
  return rest as NavMenuItem;
}

async function loadAll(): Promise<NavMenuItem[]> {
  const table = tableName(TABLES.Content);
  const out: NavMenuItem[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await getDdbDoc().send(
      new ScanCommand({
        TableName: table,
        FilterExpression: "entity = :e",
        ExpressionAttributeValues: { ":e": "nav" },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const row of res.Items ?? []) {
      const item = fromItem(row);
      if (item) out.push(item);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

async function upsert(item: NavMenuItem): Promise<void> {
  await getDdbDoc().send(
    new PutCommand({
      TableName: tableName(TABLES.Content),
      Item: toItem(item),
    }),
  );
}

async function main(): Promise<void> {
  logger.info("Seeding system nav menu items");
  const existing = await loadAll();

  // First pass: ensure parent (Shop) exists or is matched.
  // Lookup helper — match by label (case-insensitive).
  function findByLabel(label: string): NavMenuItem | undefined {
    return existing.find((i) => i.label.trim().toLowerCase() === label.toLowerCase());
  }

  const labelToId = new Map<string, string>();

  // Create or update each system item.
  for (const seed of SYSTEM_ITEMS) {
    const matched = findByLabel(seed.label);

    // Resolve parentId by parentLabel.
    const parentId = seed.parentLabel ? (labelToId.get(seed.parentLabel) ?? null) : null;

    if (matched) {
      const updated: NavMenuItem = {
        ...matched,
        // Force routing fields to the canonical values.
        kind: seed.kind,
        href: seed.href,
        categorySlug: null,
        parentId,
        isSystem: true,
      };
      await upsert(updated);
      labelToId.set(seed.label, updated.id);
      logger.info({ label: seed.label, id: updated.id }, "Marked existing nav item as system");
    } else {
      const created: NavMenuItem = {
        id: `nav_${nanoid(10)}`,
        label: seed.label,
        kind: seed.kind,
        href: seed.href,
        categorySlug: null,
        parentId,
        sortOrder: seed.sortOrder,
        visible: true,
        isSystem: true,
      };
      await upsert(created);
      labelToId.set(seed.label, created.id);
      logger.info({ label: seed.label, id: created.id }, "Created system nav item");
    }
  }

  logger.info("System nav menu seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "Nav seed failed");
    process.exit(1);
  });
