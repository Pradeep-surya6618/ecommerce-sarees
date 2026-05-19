"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clsx } from "@/lib/utils/clsx";
import { Container } from "@/components/ui/Container";
import type { Banner } from "@/types/domain";

export interface BannerHeroProps {
  banners: Banner[];
}

const SLIDE_DURATION_MS = 4000;

export function BannerHero({ banners }: BannerHeroProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Auto-advance: timer restarts whenever activeIdx changes (so user clicks reset the countdown).
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = window.setTimeout(() => {
      setActiveIdx((i) => (i + 1) % banners.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeIdx, banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden md:h-[72vh]">
      {banners.map((banner, idx) => {
        const isActive = idx === activeIdx;
        return (
          <div
            key={banner.id}
            aria-hidden={!isActive}
            className={clsx(
              "absolute inset-0 transition-opacity duration-1000 ease-out",
              isActive ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <div className="absolute inset-0 overflow-hidden">
              <Image
                key={`img-${idx}-${isActive ? activeIdx : "idle"}`}
                src={banner.imageUrl}
                alt={banner.imageAlt}
                fill
                priority={idx === 0}
                sizes="100vw"
                className={clsx("object-cover", isActive ? "banner-ken-burns" : "scale-100")}
                style={isActive ? { animationDuration: `${SLIDE_DURATION_MS}ms` } : undefined}
              />
              {isActive && (
                <div
                  key={`overlay-${idx}-${activeIdx}`}
                  aria-hidden
                  className="banner-overlay-fade absolute inset-0 bg-ink-900/40"
                  style={{ animationDuration: `${SLIDE_DURATION_MS}ms` }}
                />
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-ink-900/55 via-ink-900/20 to-transparent" />
            <Container size="xl" className="relative flex h-full items-center">
              <div className="max-w-xl text-white">
                <span className="text-[10px] uppercase tracking-[0.22em] opacity-90 sm:text-xs sm:tracking-[0.25em]">
                  The Edit
                </span>
                <h1 className="mt-2 font-display text-2xl leading-tight sm:mt-3 sm:text-4xl md:text-6xl">
                  {banner.title}
                </h1>
                {banner.subtitle && (
                  <p className="mt-3 max-w-md text-sm opacity-90 sm:mt-4 sm:text-base md:text-lg">
                    {banner.subtitle}
                  </p>
                )}
                <Link
                  href={banner.ctaHref}
                  className="mt-5 inline-flex items-center justify-center rounded-sm bg-bg-base px-4 py-2 text-xs font-medium text-ink-900 transition hover:bg-bg-elevated sm:mt-8 sm:px-6 sm:py-3 sm:text-sm"
                >
                  {banner.ctaLabel}
                </Link>
              </div>
            </Container>
          </div>
        );
      })}

      {/* Progress dots — bottom-right, circular loading style */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 right-6 z-10 flex items-center gap-3 md:bottom-8 md:right-10">
          {banners.map((b, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={b.id}
                type="button"
                aria-label={`Show banner ${idx + 1}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => setActiveIdx(idx)}
                className="group relative inline-flex h-5 w-5 cursor-pointer items-center justify-center"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  className="absolute inset-0"
                  aria-hidden
                >
                  {/* Track ring */}
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                    className="transition-stroke group-hover:stroke-white/50"
                  />
                  {/* Progress arc — only on active, drawn from 12 o'clock */}
                  {isActive && (
                    <circle
                      key={`progress-${activeIdx}`}
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      pathLength={100}
                      strokeDasharray={100}
                      strokeDashoffset={100}
                      transform="rotate(-90 10 10)"
                      className="banner-circular-fill"
                      style={{ animationDuration: `${SLIDE_DURATION_MS}ms` }}
                    />
                  )}
                  {/* Center dot */}
                  <circle
                    cx="10"
                    cy="10"
                    r="2"
                    fill={isActive ? "white" : "rgba(255,255,255,0.5)"}
                  />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
