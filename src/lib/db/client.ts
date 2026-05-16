import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env } from "@/lib/env";

let rawClient: DynamoDBClient | null = null;
let docClient: DynamoDBDocumentClient | null = null;

function buildRaw(): DynamoDBClient {
  return new DynamoDBClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export function getDdbRaw(): DynamoDBClient {
  if (!rawClient) rawClient = buildRaw();
  return rawClient;
}

export function getDdbDoc(): DynamoDBDocumentClient {
  if (!docClient) {
    docClient = DynamoDBDocumentClient.from(getDdbRaw(), {
      marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false },
    });
  }
  return docClient;
}
