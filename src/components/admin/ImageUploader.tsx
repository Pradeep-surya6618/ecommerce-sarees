"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { requestUploadUrlAction } from "@/server/actions/uploads";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_BYTES = 10 * 1024 * 1024;

export interface ImageUploaderProps {
  folder: "products" | "categories" | "banners" | "blog" | "reviews";
  onUploaded: (publicUrl: string) => void;
  label?: string;
  className?: string;
}

export function ImageUploader({
  folder,
  onUploaded,
  label = "Upload",
  className = "",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("File too large", { description: "Max size is 10MB." });
      return;
    }
    setBusy(true);
    try {
      const presign = await requestUploadUrlAction({
        folder,
        contentType: file.type,
        contentLength: file.size,
      });
      if (!presign.ok) {
        toast.error("Couldn't start upload", { description: presign.error });
        return;
      }

      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        toast.error("Upload failed", { description: `S3 responded ${put.status}` });
        return;
      }

      onUploaded(presign.publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      toast.error("Upload failed", { description: message });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-sm border border-ink-500/30 bg-bg-elevated px-3 py-2 text-sm text-ink-900 transition hover:border-accent-primary hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy ? "Uploading…" : label}
      </button>
    </>
  );
}
