"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createPresignedUpload } from "@/lib/storage/s3";

const ALLOWED_FOLDERS = new Set(["products", "categories", "banners", "blog", "reviews"]);

export type RequestUploadResult =
  | { ok: true; uploadUrl: string; publicUrl: string; key: string; expiresIn: number }
  | { ok: false; error: string };

export interface RequestUploadInput {
  folder: string;
  contentType: string;
  contentLength: number;
}

export async function requestUploadUrlAction(
  input: RequestUploadInput,
): Promise<RequestUploadResult> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, error: "Admin access required." };
  }

  if (!ALLOWED_FOLDERS.has(input.folder)) {
    return { ok: false, error: `Unknown upload folder: ${input.folder}` };
  }

  try {
    const result = await createPresignedUpload({
      folder: input.folder,
      contentType: input.contentType,
      contentLength: input.contentLength,
    });
    return {
      ok: true,
      uploadUrl: result.uploadUrl,
      publicUrl: result.publicUrl,
      key: result.key,
      expiresIn: result.expiresIn,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to prepare upload";
    return { ok: false, error: message };
  }
}
