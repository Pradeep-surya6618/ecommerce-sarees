import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
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

function requireBucket(): string {
  if (!env.S3_BUCKET) {
    throw new Error("S3_BUCKET is not configured in environment");
  }
  return env.S3_BUCKET;
}

function requireCdnBase(): string {
  if (!env.CDN_BASE_URL) {
    throw new Error("CDN_BASE_URL is not configured in environment");
  }
  return env.CDN_BASE_URL;
}

export const S3_PUBLIC_PREFIX = env.S3_PUBLIC_PREFIX;

export function cdnUrl(key: string): string {
  const trimmed = key.replace(/^\/+/, "");
  return `${requireCdnBase().replace(/\/+$/, "")}/${trimmed}`;
}

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function extensionFor(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

export interface PresignedUploadInput {
  folder: string; // e.g. "products", "categories", "banners"
  contentType: string;
  contentLength: number; // bytes
}

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const URL_TTL_SECONDS = 300; // 5 min

export async function createPresignedUpload(
  input: PresignedUploadInput,
): Promise<PresignedUploadResult> {
  if (!ALLOWED_CONTENT_TYPES.has(input.contentType)) {
    throw new Error(`Unsupported file type: ${input.contentType}`);
  }
  if (input.contentLength <= 0 || input.contentLength > MAX_UPLOAD_BYTES) {
    throw new Error(`File size must be between 1 byte and ${MAX_UPLOAD_BYTES / 1024 / 1024}MB`);
  }
  const safeFolder = input.folder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "misc";
  const ext = extensionFor(input.contentType);
  const key = `${S3_PUBLIC_PREFIX}${safeFolder}/${nanoid(16)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: requireBucket(),
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });

  const uploadUrl = await getSignedUrl(getS3(), command, { expiresIn: URL_TTL_SECONDS });

  return {
    uploadUrl,
    key,
    publicUrl: cdnUrl(key),
    expiresIn: URL_TTL_SECONDS,
  };
}
