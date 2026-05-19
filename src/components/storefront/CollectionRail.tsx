"use client";

import { useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SareeMotifBg, type SareeMotif } from "@/components/storefront/SareeMotifBg";
import { Container } from "@/components/ui/Container";
import { IconButton } from "@/components/ui/IconButton";
import { SectionHeading } from "@/components/ui/SectionHeading";

export interface CollectionRailProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  motif?: SareeMotif;
  motifId?: string;
  motifTileSize?: number;
}

export function CollectionRail({
  eyebrow,
  title,
  description,
  children,
  motif,
  motifId,
  motifTileSize,
}: CollectionRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }, []);

  return (
    <section className="relative overflow-hidden py-20">
      {motif && (
        <SareeMotifBg
          id={motifId ?? `rail-${motif}`}
          variant={motif}
          tileSize={motifTileSize}
          className="text-accent-primary opacity-[0.16]"
        />
      )}
      <Container size="xl" className="relative">
        <div className="mb-8 flex items-end justify-between gap-6">
          <SectionHeading eyebrow={eyebrow} title={title} description={description} />
          <div className="hidden items-center gap-2 md:flex">
            <IconButton
              aria-label="Previous"
              variant="solid"
              onClick={() => scrollBy(-1)}
              className="border-0 bg-accent-primary text-bg-base hover:bg-accent-primary-hover hover:text-bg-base"
            >
              <ChevronLeft className="h-5 w-5" />
            </IconButton>
            <IconButton
              aria-label="Next"
              variant="solid"
              onClick={() => scrollBy(1)}
              className="border-0 bg-accent-primary text-bg-base hover:bg-accent-primary-hover hover:text-bg-base"
            >
              <ChevronRight className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
        <div
          ref={scrollerRef}
          className="scrollbar-hide -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-8 pb-2 [scroll-padding-inline-start:2rem] md:-mx-8 md:gap-6 md:px-10 md:[scroll-padding-inline-start:2.5rem]"
        >
          {children}
        </div>
      </Container>
    </section>
  );
}
