import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatRupees } from "@/lib/money";
import { Container } from "@/components/ui/Container";
import type { Product } from "@/types/domain";

export interface EditorsPicksProps {
  products: Product[];
}

export function EditorsPicks({ products }: EditorsPicksProps) {
  if (products.length === 0) return null;

  // Duplicate the list so the marquee can loop seamlessly when the first set
  // scrolls past the left edge.
  const items = [...products, ...products];

  return (
    <section className="overflow-hidden bg-bg-base py-12 md:py-20">
      <Container size="xl" className="mb-8 md:mb-12">
        <div className="flex flex-col gap-3 sm:gap-2 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent-gold sm:text-xs">
              Editor&apos;s picks
            </span>
            <h2 className="font-display text-2xl leading-tight text-ink-900 sm:text-3xl md:text-4xl">
              Featured this season
            </h2>
            <p className="text-sm text-ink-700 sm:text-base">Sarees we keep reaching for.</p>
          </div>
          <Link
            href="/shop"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent-primary transition hover:text-accent-primary-hover"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Container>

      {/* Marquee — extends beyond container so it bleeds edge-to-edge */}
      <div className="editors-marquee-pause relative">
        <div className="editors-marquee flex w-max gap-4 sm:gap-5">
          {items.map((p, idx) => (
            <PickCard key={`${p.id}-${idx}`} product={p} ariaHidden={idx >= products.length} />
          ))}
        </div>
        {/* Soft edge fades so cards melt into the page bg as they enter/exit */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-bg-elevated/70 to-transparent md:w-16 md:from-bg-elevated/60"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-bg-elevated/70 to-transparent md:w-16 md:from-bg-elevated/60"
        />
      </div>
    </section>
  );
}

function PickCard({ product, ariaHidden }: { product: Product; ariaHidden: boolean }) {
  const img = product.images[0];
  if (!img) return null;

  return (
    <Link
      href={`/product/${product.slug}`}
      aria-hidden={ariaHidden}
      tabIndex={ariaHidden ? -1 : 0}
      className="group relative block aspect-[3/4] w-[260px] shrink-0 overflow-hidden rounded-md bg-ink-900 sm:w-[300px] md:w-[340px]"
    >
      <Image
        src={img.url}
        alt={img.alt}
        fill
        sizes="340px"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/15 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-white sm:p-5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-accent-gold sm:text-xs">
          {product.fabric}
        </span>
        <h3 className="font-display text-base leading-tight sm:text-lg">{product.name}</h3>
        <span className="mt-0.5 text-sm font-semibold tabular-nums sm:text-base">
          {formatRupees(product.priceInPaise)}
        </span>
      </div>
    </Link>
  );
}
