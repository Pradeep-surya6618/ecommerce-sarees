"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { clsx } from "@/lib/utils/clsx";
import { Container } from "@/components/ui/Container";
import type { Banner } from "@/types/domain";

export interface BannerHeroProps {
  banners: Banner[];
}

export function BannerHero({ banners }: BannerHeroProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 35 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("init", onSelect);
    const interval = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("init", onSelect);
      clearInterval(interval);
    };
  }, [emblaApi, onSelect]);

  if (banners.length === 0) return null;

  return (
    <section className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {banners.map((banner, idx) => (
            <div key={banner.id} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative h-[60vh] min-h-[420px] w-full md:h-[72vh]">
                <Image
                  src={banner.imageUrl}
                  alt={banner.imageAlt}
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-900/55 via-ink-900/20 to-transparent" />
                <Container size="xl" className="relative flex h-full items-center">
                  <div className="max-w-xl text-white">
                    <span className="text-xs uppercase tracking-[0.25em] opacity-90">The Edit</span>
                    <h1 className="mt-3 font-display text-4xl md:text-6xl">{banner.title}</h1>
                    {banner.subtitle && (
                      <p className="mt-4 max-w-md text-base opacity-90 md:text-lg">
                        {banner.subtitle}
                      </p>
                    )}
                    <Link
                      href={banner.ctaHref}
                      className="mt-8 inline-flex items-center justify-center rounded-sm bg-bg-base px-6 py-3 text-sm font-medium text-ink-900 transition hover:bg-bg-elevated"
                    >
                      {banner.ctaLabel}
                    </Link>
                  </div>
                </Container>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {banners.map((b, idx) => (
          <button
            key={b.id}
            type="button"
            aria-label={`Slide ${idx + 1}`}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={clsx(
              "h-1 rounded-full transition-all",
              selectedIndex === idx ? "w-10 bg-bg-base" : "w-4 bg-bg-base/40",
            )}
          />
        ))}
      </div>
    </section>
  );
}
