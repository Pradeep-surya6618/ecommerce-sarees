import {
  DeleteTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import { getDdbRaw } from "@/lib/db/client";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// Deletes every physical table in this project's DDB_TABLE_PREFIX namespace.
// Used when migrating from the old 17-table schema to the new 7-table schema.
// Run: npm run dynamo:teardown
const LEGACY_TABLE_NAMES = [
  "Users",
  "OtpCodes",
  "Sessions",
  "Categories",
  "Products",
  "Inventory",
  "Carts",
  "Addresses",
  "Orders",
  "Coupons",
  "Banners",
  "Reviews",
  "BlogPosts",
  "WebhookEvents",
  "AdminAuditLog",
  "Settings",
  "RateLimits",
  // New 7-table names included so this script also wipes a partial new setup
  // if you ever need to re-run from scratch.
  "Ephemeral",
  "Content",
];

async function tableExists(physicalName: string): Promise<boolean> {
  try {
    await getDdbRaw().send(new DescribeTableCommand({ TableName: physicalName }));
    return true;
  } catch (err) {
    if (err instanceof ResourceNotFoundException) return false;
    throw err;
  }
}

async function waitForGone(physicalName: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    if (!(await tableExists(physicalName))) return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Table ${physicalName} did not finish deleting within timeout`);
}

async function deleteOne(physicalName: string): Promise<void> {
  if (!(await tableExists(physicalName))) {
    logger.info({ table: physicalName }, "table not found, skipping");
    return;
  }
  await getDdbRaw().send(new DeleteTableCommand({ TableName: physicalName }));
  logger.info({ table: physicalName }, "delete requested");
}

async function main(): Promise<void> {
  logger.info({ prefix: env.DDB_TABLE_PREFIX }, "Starting DynamoDB teardown");
  const physicalNames = LEGACY_TABLE_NAMES.map((n) => `${env.DDB_TABLE_PREFIX}${n}`);

  for (const name of physicalNames) {
    await deleteOne(name);
  }
  for (const name of physicalNames) {
    await waitForGone(name);
  }
  logger.info("DynamoDB teardown complete");
}

if (process.argv[1]?.includes("dynamo-teardown")) {
  main().catch((err) => {
    logger.error({ err }, "dynamo teardown failed");
    process.exit(1);
  });
}
