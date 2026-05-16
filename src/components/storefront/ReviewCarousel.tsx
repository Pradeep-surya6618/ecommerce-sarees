"use client";

import useEmblaCarousel from "embla-carousel-react";
import { Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Review } from "@/types/domain";

export function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const [emblaRef] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });

  if (reviews.length === 0) return null;

  return (
    <section className="bg-bg-elevated py-20">
      <Container size="xl">
        <SectionHeading
          eyebrow="From the community"
          title="What customers say"
          align="center"
          className="mb-10"
        />
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-6">
            {reviews.map((r) => (
              <figure
                key={r.id}
                className="flex min-w-0 flex-[0_0_85%] flex-col gap-4 rounded-md border border-ink-500/10 bg-bg-base p-8 md:flex-[0_0_45%] lg:flex-[0_0_30%]"
              >
                <div className="flex items-center gap-1 text-accent-gold">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                {r.title && <h3 className="font-display text-xl text-ink-900">{r.title}</h3>}
                <blockquote className="text-sm text-ink-700">&ldquo;{r.body}&rdquo;</blockquote>
                <figcaption className="mt-auto text-xs uppercase tracking-wide text-ink-500">
                  {r.authorName}
                  {r.verifiedPurchase && " · Verified buyer"}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
