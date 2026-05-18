"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatRupees } from "@/lib/money";
import type { Product } from "@/types/domain";

export interface RelatedProductsCarouselProps {
  products: Product[];
  categoryName?: string;
}

export function RelatedProductsCarousel({ products, categoryName }: RelatedProductsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("init", sync);
    emblaApi.on("select", sync);
    emblaApi.on("reInit", sync);
    return () => {
      emblaApi.off("init", sync);
      emblaApi.off("select", sync);
      emblaApi.off("reInit", sync);
    };
  }, [emblaApi, sync]);

  if (products.length === 0) return null;

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-5 pb-2">
          {products.map((p) => {
            const image = p.images[0];
            return (
              <div
                key={p.id}
                className="min-w-0 flex-[0_0_75%] sm:flex-[0_0_45%] lg:flex-[0_0_22%]"
              >
                <Link
                  href={`/product/${p.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-md border border-ink-500/10 bg-bg-elevated transition hover:border-ink-700"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-500/5">
                    {image && (
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 75vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 p-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-primary">
                      {categoryName ?? p.categorySlug.replace(/-/g, " ")}
                    </span>
                    <h3 className="line-clamp-2 font-display text-base text-ink-900">{p.name}</h3>
                    <span className="mt-1 font-semibold tabular-nums text-ink-900">
                      {formatRupees(p.priceInPaise)}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prev / next */}
      <button
        type="button"
        aria-label="Previous"
        disabled={!canPrev}
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute -left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-500/15 bg-bg-elevated text-ink-700 shadow-card transition hover:text-ink-900 disabled:opacity-30 md:-left-5"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next"
        disabled={!canNext}
        onClick={() => emblaApi?.scrollNext()}
        className="absolute -right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-500/15 bg-bg-elevated text-ink-700 shadow-card transition hover:text-ink-900 disabled:opacity-30 md:-right-5"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
