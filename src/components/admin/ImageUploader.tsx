"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import { requestUploadUrlAction } from "@/server/actions/uploads";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_BYTES = 10 * 1024 * 1024;

export interface ImageUploaderProps {
  folder: "products" | "categories" | "banners" | "blog" | "reviews";
  onUploaded: (publicUrl: string) => void;
  label?: string;
  className?: string;
  variant?: "button" | "dropzone";
  hint?: string;
}

export function ImageUploader({
  folder,
  onUploaded,
  label = "Upload",
  className = "",
  variant = "button",
  hint,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }
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

  const fileInput = (
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
  );

  if (variant === "dropzone") {
    return (
      <>
        {fileInput}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          disabled={busy}
          aria-label="Upload image"
          className={clsx(
            "group relative flex w-full cursor-pointer flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-2 border-dashed bg-gradient-to-br p-5 text-center transition disabled:cursor-not-allowed disabled:opacity-70 sm:gap-3 sm:p-6",
            dragging
              ? "border-accent-primary from-accent-primary/10 to-accent-primary/5 scale-[1.01]"
              : "border-ink-500/25 from-bg-elevated to-bg-base hover:border-accent-primary/60 hover:from-accent-primary/[0.04] hover:to-accent-primary/[0.02]",
            className,
          )}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/50 to-transparent"
          />

          <span
            className={clsx(
              "inline-flex h-12 w-12 items-center justify-center rounded-full shadow-[0_8px_20px_-10px_rgba(91,58,138,0.5)] transition group-hover:scale-105 sm:h-14 sm:w-14",
              dragging
                ? "bg-accent-primary text-white"
                : "bg-gradient-to-br from-accent-primary/15 to-accent-primary/5 text-accent-primary group-hover:from-accent-primary/20 group-hover:to-accent-primary/10",
            )}
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin sm:h-6 sm:w-6" />
            ) : (
              <ImagePlus className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </span>

          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-ink-900">
              {busy ? "Uploading…" : dragging ? "Drop to upload" : label}
            </span>
            <span className="text-[10px] text-ink-500 sm:text-[11px]">
              {hint ?? "Drag & drop or click · PNG, JPG, WEBP up to 10MB"}
            </span>
          </div>
        </button>
      </>
    );
  }

  return (
    <>
      {fileInput}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={clsx(
          "inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink-500/25 bg-bg-elevated px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-accent-primary hover:bg-accent-primary/5 hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {busy ? "Uploading…" : label}
      </button>
    </>
  );
}
