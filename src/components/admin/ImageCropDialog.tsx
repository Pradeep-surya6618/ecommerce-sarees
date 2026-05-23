"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop";
import { Crop as CropIcon, Loader2, X } from "lucide-react";
import "react-image-crop/dist/ReactCrop.css";

// useSyncExternalStore-based client check — false during SSR, true once on
// the client. Avoids hydration mismatch without setState-in-effect.
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

export interface ImageCropDialogProps {
  open: boolean;
  file: File | null;
  aspectRatio: number;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void | Promise<void>;
}

// Renders a portalled modal that lets the admin choose a crop region from the
// picked file, then returns the cropped result as a new File. The output type
// matches the input (jpg stays jpg, png stays png) so the existing presigned
// upload path keeps working unchanged.
export function ImageCropDialog({
  open,
  file,
  aspectRatio,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const mounted = useIsClient();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [working, setWorking] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // URL.createObjectURL allocates browser memory that must be revoked when
  // the file changes or the component unmounts. useEffect is the correct API
  // for this kind of external-resource lifecycle, even though setState fires
  // inside — the lint rule has a false positive for object-URL bookkeeping.
  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);

    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const initial = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, aspectRatio, naturalWidth, naturalHeight),
      naturalWidth,
      naturalHeight,
    );
    setCrop(initial);
    setCompletedCrop({
      unit: "px",
      x: (initial.x / 100) * naturalWidth,
      y: (initial.y / 100) * naturalHeight,
      width: (initial.width / 100) * naturalWidth,
      height: (initial.height / 100) * naturalHeight,
    });
  }

  async function confirm() {
    if (!file || !imgRef.current || !completedCrop) return;
    setWorking(true);
    try {
      const blob = await cropImageToBlob(imgRef.current, completedCrop, file.type);
      if (!blob) {
        setWorking(false);
        return;
      }
      const cropped = new File([blob], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });
      await onConfirm(cropped);
    } finally {
      setWorking(false);
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !working) onCancel();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated shadow-elev">
        <header className="flex items-center justify-between gap-3 border-b border-ink-500/10 bg-bg-base/60 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
              <CropIcon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
            <div className="flex flex-col">
              <h2 className="font-display text-base text-ink-900 sm:text-lg">Crop image</h2>
              <p className="text-[11px] text-ink-500 sm:text-xs">
                Adjust the frame, then save to upload the cropped image.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            aria-label="Close"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-ink-900/[0.04] p-4 sm:p-6">
          {imageUrl && (
            <ReactCrop
              crop={crop}
              onChange={(_, percent) => setCrop(percent)}
              onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              aspect={aspectRatio}
              minWidth={50}
              keepSelection
              className="max-h-[60vh]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageUrl}
                alt="To crop"
                onLoad={handleImageLoad}
                className="max-h-[60vh] w-auto select-none"
                draggable={false}
              />
            </ReactCrop>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-ink-500/10 bg-bg-base/60 px-4 py-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="cursor-pointer rounded-full px-4 py-2 text-xs font-medium text-ink-700 transition hover:bg-ink-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={working || !completedCrop}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent-primary px-4 py-2 text-xs font-medium text-white shadow-[0_8px_24px_-12px_rgba(91,58,138,0.7)] transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            {working ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CropIcon className="h-3.5 w-3.5" />
            )}
            {working ? "Uploading…" : "Crop & upload"}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

async function cropImageToBlob(
  img: HTMLImageElement,
  crop: PixelCrop,
  type: string,
): Promise<Blob | null> {
  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;
  const canvas = document.createElement("canvas");
  // Crop dimensions are in display pixels — multiply by the scale to get the
  // native-resolution crop. Output preserves the full input resolution.
  canvas.width = Math.round(crop.width * scaleX);
  canvas.height = Math.round(crop.height * scaleY);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  // Preserve as much of the original as possible. PNG/AVIF/WebP are lossless
  // (or near-lossless); JPEG keeps 98% quality which is visually indistinguishable
  // from the input but well under uncompressed size.
  const outputType =
    type === "image/png" || type === "image/webp" || type === "image/avif" ? type : "image/jpeg";
  const quality = outputType === "image/jpeg" ? 0.98 : undefined;
  return await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
}
