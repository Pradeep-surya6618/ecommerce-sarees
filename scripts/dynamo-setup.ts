import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceInUseException,
  ResourceNotFoundException,
  UpdateContinuousBackupsCommand,
  UpdateTimeToLiveCommand,
  type AttributeDefinition,
  type CreateTableCommandInput,
  type GlobalSecondaryIndex,
  type KeySchemaElement,
} from "@aws-sdk/client-dynamodb";
import { getDdbRaw } from "@/lib/db/client";
import { tableName, TABLES, type LogicalTable } from "@/lib/db/tables";
import { logger } from "@/lib/logger";

interface GsiSpec {
  name: string;
  hashKey: string;
  hashKeyType?: "S" | "N";
  rangeKey?: string;
  rangeKeyType?: "S" | "N";
}

export interface TableSpec {
  name: LogicalTable;
  hashKey: string;
  hashKeyType?: "S" | "N";
  rangeKey?: string;
  rangeKeyType?: "S" | "N";
  gsis?: GsiSpec[];
  ttlAttribute?: string;
}

// 7-table design.
//
//  - Users      → user profile + addresses[] + wishlist[] + preferences (all embedded as attributes)
//  - Categories → admin-managed taxonomy
//  - Products   → product catalog with inventory.stock embedded per variant
//  - Carts      → guest + user carts (TTL'd)
//  - Orders     → orders (must scale independently)
//  - Ephemeral  → single-table for sessions / otp / rateLimits / webhookEvents
//                 PK is type-prefixed, e.g. "SESSION#abc", "OTP#email", "RL#bucket", "WH#event"
//                 SK varies: "META" / purposeOtpId
//  - Content    → single-table for coupons / banners / reviews / blogPosts / adminAuditLog / settings
//                 PK is type-prefixed, e.g. "COUPON#code", "REVIEW#productId", "POST#id"
export const TABLE_SPECS: TableSpec[] = [
  {
    name: TABLES.Users,
    hashKey: "userId",
    gsis: [{ name: "EmailIndex", hashKey: "email" }],
  },
  {
    name: TABLES.Categories,
    hashKey: "categoryId",
    gsis: [{ name: "SlugIndex", hashKey: "slug" }],
  },
  {
    name: TABLES.Products,
    hashKey: "productId",
    gsis: [
      { name: "SlugIndex", hashKey: "slug" },
      { name: "CategoryStatusIndex", hashKey: "categoryId", rangeKey: "statusCreatedAt" },
    ],
  },
  {
    name: TABLES.Carts,
    hashKey: "cartId",
    gsis: [
      { name: "UserIndex", hashKey: "userId" },
      { name: "SessionIndex", hashKey: "guestSessionId" },
    ],
    ttlAttribute: "expiresAt",
  },
  {
    name: TABLES.Orders,
    hashKey: "orderId",
    gsis: [
      { name: "UserCreatedIndex", hashKey: "userId", rangeKey: "createdAt" },
      { name: "StatusCreatedIndex", hashKey: "status", rangeKey: "createdAt" },
    ],
  },
  {
    name: TABLES.Ephemeral,
    hashKey: "pk",
    rangeKey: "sk",
    gsis: [{ name: "UserIndex", hashKey: "userId", rangeKey: "pk" }],
    ttlAttribute: "expiresAt",
  },
  {
    name: TABLES.Content,
    hashKey: "pk",
    rangeKey: "sk",
    gsis: [
      { name: "GSI1", hashKey: "gsi1pk", rangeKey: "gsi1sk" },
      { name: "SlugIndex", hashKey: "slug" },
    ],
  },
];

function attrDefs(spec: TableSpec): AttributeDefinition[] {
  const attrs = new Map<string, "S" | "N">();
  attrs.set(spec.hashKey, spec.hashKeyType ?? "S");
  if (spec.rangeKey) attrs.set(spec.rangeKey, spec.rangeKeyType ?? "S");
  for (const gsi of spec.gsis ?? []) {
    attrs.set(gsi.hashKey, gsi.hashKeyType ?? "S");
    if (gsi.rangeKey) attrs.set(gsi.rangeKey, gsi.rangeKeyType ?? "S");
  }
  return [...attrs.entries()].map(([AttributeName, AttributeType]) => ({
    AttributeName,
    AttributeType,
  }));
}

function keySchema(hashKey: string, rangeKey?: string): KeySchemaElement[] {
  const schema: KeySchemaElement[] = [{ AttributeName: hashKey, KeyType: "HASH" }];
  if (rangeKey) schema.push({ AttributeName: rangeKey, KeyType: "RANGE" });
  return schema;
}

function gsiDefs(spec: TableSpec): GlobalSecondaryIndex[] | undefined {
  if (!spec.gsis?.length) return undefined;
  return spec.gsis.map((g) => ({
    IndexName: g.name,
    KeySchema: keySchema(g.hashKey, g.rangeKey),
    Projection: { ProjectionType: "ALL" },
  }));
}

async function tableExists(physicalName: string): Promise<boolean> {
  try {
    await getDdbRaw().send(new DescribeTableCommand({ TableName: physicalName }));
    return true;
  } catch (err) {
    if (err instanceof ResourceNotFoundException) return false;
    throw err;
  }
}

async function createTable(spec: TableSpec): Promise<void> {
  const physicalName = tableName(spec.name);
  if (await tableExists(physicalName)) {
    logger.info({ table: physicalName }, "table already exists, skipping create");
    return;
  }

  const input: CreateTableCommandInput = {
    TableName: physicalName,
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: attrDefs(spec),
    KeySchema: keySchema(spec.hashKey, spec.rangeKey),
    GlobalSecondaryIndexes: gsiDefs(spec),
  };

  try {
    await getDdbRaw().send(new CreateTableCommand(input));
    logger.info({ table: physicalName }, "table created");
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      logger.info({ table: physicalName }, "table already in use, skipping");
      return;
    }
    throw err;
  }
}

async function waitForActive(physicalName: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    const res = await getDdbRaw().send(new DescribeTableCommand({ TableName: physicalName }));
    if (res.Table?.TableStatus === "ACTIVE") return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Table ${physicalName} did not become ACTIVE within timeout`);
}

async function ensureTtl(spec: TableSpec): Promise<void> {
  if (!spec.ttlAttribute) return;
  const physicalName = tableName(spec.name);
  try {
    await getDdbRaw().send(
      new UpdateTimeToLiveCommand({
        TableName: physicalName,
        TimeToLiveSpecification: { Enabled: true, AttributeName: spec.ttlAttribute },
      }),
    );
    logger.info({ table: physicalName, attr: spec.ttlAttribute }, "ttl enabled");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("TimeToLive is already enabled")) return;
    throw err;
  }
}

async function ensurePitr(physicalName: string): Promise<void> {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await getDdbRaw().send(
        new UpdateContinuousBackupsCommand({
          TableName: physicalName,
          PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
        }),
      );
      logger.info({ table: physicalName }, "PITR enabled");
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Continuous backups are already enabled")) return;
      if (message.includes("Backups are being enabled") && attempt < 10) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      throw err;
    }
  }
}

async function main(): Promise<void> {
  logger.info("Starting DynamoDB table setup");
  for (const spec of TABLE_SPECS) {
    await createTable(spec);
  }
  for (const spec of TABLE_SPECS) {
    const physical = tableName(spec.name);
    await waitForActive(physical);
    await ensureTtl(spec);
    await ensurePitr(physical);
  }
  logger.info("DynamoDB setup complete");
}

if (process.argv[1]?.includes("dynamo-setup")) {
  main().catch((err) => {
    logger.error({ err }, "dynamo setup failed");
    process.exit(1);
  });
}
