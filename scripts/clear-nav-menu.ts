import { DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import { logger } from "@/lib/logger";

// Wipes every nav menu item in the Content table.
// Useful before running `npm run nav:seed-system` from a clean slate.
async function main(): Promise<void> {
  const table = tableName(TABLES.Content);
  const ddb = getDdbDoc();

  logger.info("Loading all nav menu items");
  const items: Array<{ pk: string; sk: string; label: string }> = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(
      new ScanCommand({
        TableName: table,
        FilterExpression: "entity = :e",
        ExpressionAttributeValues: { ":e": "nav" },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const row of res.Items ?? []) {
      const r = row as { pk: string; sk: string; label?: string };
      items.push({ pk: r.pk, sk: r.sk, label: r.label ?? "(unnamed)" });
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  if (items.length === 0) {
    logger.info("No nav items to delete.");
    return;
  }

  logger.info({ count: items.length }, "Deleting nav items");
  await Promise.all(
    items.map((it) =>
      ddb.send(new DeleteCommand({ TableName: table, Key: { pk: it.pk, sk: it.sk } })),
    ),
  );

  for (const it of items) {
    logger.info({ label: it.label, pk: it.pk }, "Deleted");
  }
  logger.info({ count: items.length }, "Nav menu cleared");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "Nav clear failed");
    process.exit(1);
  });
