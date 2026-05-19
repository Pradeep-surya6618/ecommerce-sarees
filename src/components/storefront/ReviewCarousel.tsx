import Link from "next/link";
import { MessageSquareQuote, Star } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { SareeMotifBg } from "@/components/storefront/SareeMotifBg";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Review } from "@/types/domain";

export function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  return (
    <section className="relative overflow-hidden bg-bg-elevated py-12 md:py-20">
      <SareeMotifBg
        id="reviews"
        variant="lotus"
        tileSize={240}
        className="text-accent-primary opacity-[0.16]"
      />
      <Container size="xl" className="relative">
        <SectionHeading
          eyebrow="From the community"
          title="What customers say"
          align="center"
          className="mb-8 md:mb-10"
        />

        {reviews.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="scrollbar-hide -mx-6 flex snap-x overflow-x-auto px-6 py-4 md:-mx-8 md:px-8">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="min-w-0 flex-[0_0_85%] snap-start px-2 sm:px-3 md:flex-[0_0_45%] lg:flex-[0_0_31%]"
              >
                <ReviewCard review={r} />
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const initial = review.authorName.charAt(0).toUpperCase();
  return (
    <figure className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-md border border-ink-500/15 bg-bg-base p-4 transition duration-500 hover:-translate-y-0.5 hover:border-accent-gold/50 hover:shadow-card sm:gap-4 sm:p-6 lg:p-8">
      {/* Top gold hairline */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/45 to-transparent"
      />

      {/* Decorative quote glyph */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1 select-none font-display text-[56px] leading-none text-accent-gold/15 sm:right-4 sm:top-2 sm:text-[80px] lg:text-[100px]"
      >
        &ldquo;
      </span>

      {/* Star rating — 5 stars, filled to rating */}
      <div className="relative z-10 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={clsx(
              "h-3.5 w-3.5 sm:h-4 sm:w-4",
              i < review.rating
                ? "fill-accent-gold text-accent-gold"
                : "fill-transparent text-ink-500/30",
            )}
          />
        ))}
      </div>

      {/* Title */}
      {review.title && (
        <h3 className="relative z-10 font-display text-base leading-tight text-ink-900 sm:text-lg lg:text-xl">
          {review.title}
        </h3>
      )}

      {/* Body */}
      <blockquote className="relative z-10 flex-1 text-xs leading-relaxed text-ink-700 sm:text-sm lg:text-[15px]">
        &ldquo;{review.body}&rdquo;
      </blockquote>

      {/* Gold flourish */}
      <span
        aria-hidden
        className="h-px w-8 bg-gradient-to-r from-accent-gold to-transparent transition-all duration-500 group-hover:w-14 sm:w-10 sm:group-hover:w-16"
      />

      {/* Author block with initial avatar */}
      <figcaption className="relative z-10 flex items-center gap-2.5 sm:gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 font-display text-xs font-semibold text-accent-primary sm:h-9 sm:w-9 sm:text-sm">
          {initial}
        </span>
        <span className="text-xs font-medium text-ink-900 sm:text-sm">{review.authorName}</span>
      </figcaption>
    </figure>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-md border border-dashed border-ink-500/25 bg-bg-base px-6 py-12 text-center sm:py-16">
      {/* Soft icon halo */}
      <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent-gold/10 text-accent-gold">
        <span aria-hidden className="absolute inset-0 rounded-full bg-accent-gold/15 blur-xl" />
        <MessageSquareQuote className="relative h-7 w-7" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-xl text-ink-900 sm:text-2xl">No reviews yet</h3>
        <p className="text-sm text-ink-700 sm:text-base">
          Be the first to share your story. Your words help others find pieces they&apos;ll love.
        </p>
      </div>
      <Link
        href="/account/orders"
        className="inline-flex items-center justify-center rounded-sm border border-ink-900 px-5 py-2.5 text-xs font-medium text-ink-900 transition hover:bg-ink-900 hover:text-white sm:px-6 sm:py-3 sm:text-sm"
      >
        Write a review
      </Link>
    </div>
  );
}
