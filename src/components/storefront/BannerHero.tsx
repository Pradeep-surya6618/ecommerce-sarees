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
    <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-ink-900 md:h-[72vh]">
      {banners.map((banner, idx) => {
        const isActive = idx === activeIdx;
        const hasTitle = !!banner.title?.trim();
        const hasCta = !!banner.ctaLabel?.trim() && !!banner.ctaHref?.trim();
        const hasAnyText = hasTitle || !!banner.subtitle?.trim() || hasCta;
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
                className={clsx(
                  // Admins crop to 21:9, which matches the desktop hero aspect
                  // (~2.47:1), so object-cover fills the section without losing
                  // anything visible. Mobile (portrait viewport) center-crops
                  // the wide image to fit — acceptable for a responsive hero.
                  "object-cover",
                  isActive ? "banner-ken-burns" : "scale-100",
                )}
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
            {/* Left-edge gradient only when there's text to read on top of it. */}
            {hasAnyText && (
              <div className="absolute inset-0 bg-gradient-to-r from-ink-900/55 via-ink-900/20 to-transparent" />
            )}
            {hasAnyText && (
              <Container size="xl" className="relative flex h-full items-center">
                <div className="max-w-xl text-white">
                  {/* Eyebrow with brass hairlines + ornament */}
                  <div className="inline-flex items-center gap-2 sm:gap-3">
                    <span aria-hidden className="h-px w-6 bg-accent-gold sm:w-8" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-accent-gold sm:text-xs sm:tracking-[0.35em]">
                      The Edit
                    </span>
                    <span aria-hidden className="text-accent-gold/80">
                      ✦
                    </span>
                  </div>

                  {hasTitle && (
                    <h1 className="relative mt-3 font-display text-3xl italic leading-[1.05] sm:mt-4 sm:text-5xl md:text-[68px]">
                      {banner.title}
                      <LeafFlourish
                        aria-hidden
                        className="ml-2 inline-block h-5 w-5 -translate-y-1 text-accent-gold sm:h-7 sm:w-7 md:h-9 md:w-9"
                      />
                    </h1>
                  )}

                  {banner.subtitle && (
                    <p className="mt-3 max-w-md text-sm font-light leading-relaxed opacity-90 sm:mt-5 sm:text-base md:text-lg">
                      {banner.subtitle}
                    </p>
                  )}
                  {hasCta && (
                    <Link
                      href={banner.ctaHref}
                      className="mt-5 inline-flex items-center gap-2 rounded-sm bg-accent-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-accent-primary-hover sm:mt-8 sm:px-6 sm:py-3 sm:text-sm"
                    >
                      {banner.ctaLabel}
                    </Link>
                  )}
                </div>
              </Container>
            )}
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

/** Small two-leaf ornament that sits next to editorial headlines. */
function LeafFlourish({ className }: { className?: string; "aria-hidden"?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Two opposing leaves growing from a center stem */}
      <path d="M20 6 C26 12 26 20 20 28" />
      <path d="M20 6 C14 12 14 20 20 28" />
      <path d="M20 14 C24 16 26 20 24 24" />
      <path d="M20 14 C16 16 14 20 16 24" />
      <circle cx="20" cy="6" r="1.4" fill="currentColor" />
    </svg>
  );
}
