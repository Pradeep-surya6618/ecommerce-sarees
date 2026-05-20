"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { clsx } from "@/lib/utils/clsx";
import type { ProductImage } from "@/types/domain";

export interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  badge?: string;
}

export function ProductGallery({ images, productName, badge }: ProductGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const onThumbClick = useCallback(
    (idx: number) => {
      emblaApi?.scrollTo(idx);
      setSelected(idx);
    },
    [emblaApi],
  );

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ x, y });
  }

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:gap-4">
      <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col">
        {images.map((img, idx) => (
          <button
            key={img.url}
            type="button"
            onClick={() => onThumbClick(idx)}
            aria-label={`View image ${idx + 1}`}
            className={clsx(
              "relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-sm border transition",
              selected === idx ? "border-ink-900" : "border-ink-500/15 hover:border-ink-700",
            )}
          >
            <Image src={img.url} alt={img.alt} fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      <div className="order-1 flex-1 md:order-2">
        <div ref={emblaRef} className="relative overflow-hidden">
          <div className="flex">
            {images.map((img, idx) => (
              <div key={img.url} className="relative min-w-0 flex-[0_0_100%]">
                <div
                  className="group relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-md bg-ink-500/5"
                  onMouseMove={onMouseMove}
                  onMouseLeave={() => setZoom(null)}
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    priority={idx === 0}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className={clsx(
                      "object-cover transition-transform duration-200",
                      zoom && selected === idx ? "scale-150" : "scale-100",
                    )}
                    style={
                      zoom && selected === idx
                        ? { transformOrigin: `${zoom.x}% ${zoom.y}%` }
                        : undefined
                    }
                  />
                  <span className="sr-only">
                    {productName} – image {idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {badge && (
            <span className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-ink-900/85 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wide text-white backdrop-blur">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
