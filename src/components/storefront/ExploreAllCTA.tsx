import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function ExploreAllCTA() {
  return (
    <section className="relative overflow-hidden bg-bg-base py-14 md:py-24">
      {/* Top + bottom brass hairlines */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/45 to-transparent"
      />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-gold/35 to-transparent"
      />
      <Container size="xl" className="relative">
        <div className="flex flex-col items-center gap-4 text-center sm:gap-6">
          <span className="text-[10px] uppercase tracking-[0.3em] text-accent-gold sm:text-xs">
            All sarees
          </span>
          <h2 className="font-display text-2xl leading-tight text-ink-900 sm:text-4xl md:text-6xl">
            The full edit, in one place.
          </h2>
          <span
            aria-hidden
            className="h-px w-12 bg-gradient-to-r from-transparent via-accent-gold to-transparent"
          />
          <p className="max-w-xl text-sm text-ink-700 sm:text-base md:text-lg">
            Every saree we currently carry — silks, cottons, linens, designer drapes — sortable by
            price, fabric, occasion, and colour.
          </p>
          <Link
            href="/shop"
            className="mt-1 inline-flex items-center gap-2 rounded-sm bg-accent-primary px-5 py-2.5 text-xs font-medium text-bg-base transition hover:bg-accent-primary-hover sm:mt-2 sm:px-7 sm:py-3.5 sm:text-sm"
          >
            Explore all sarees
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
