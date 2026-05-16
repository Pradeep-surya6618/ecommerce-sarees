import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

let client: S3Client | null = null;

export function getS3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export const S3_BUCKET = env.S3_BUCKET;
export const S3_PUBLIC_PREFIX = env.S3_PUBLIC_PREFIX;

export function cdnUrl(key: string): string {
  const trimmed = key.replace(/^\/+/, "");
  return `${env.CDN_BASE_URL.replace(/\/+$/, "")}/${trimmed}`;
}
