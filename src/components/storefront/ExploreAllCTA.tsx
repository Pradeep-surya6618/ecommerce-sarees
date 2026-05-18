import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function ExploreAllCTA() {
  return (
    <section className="relative overflow-hidden bg-ink-900 py-24 text-bg-base">
      <Image
        src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=2000&q=80"
        alt=""
        fill
        sizes="100vw"
        aria-hidden
        className="object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-900/85 via-ink-900/60 to-ink-900/85" />
      <Container size="xl" className="relative">
        <div className="flex flex-col items-center gap-6 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-accent-gold">All sarees</span>
          <h2 className="font-display text-4xl md:text-6xl">The full edit, in one place.</h2>
          <p className="max-w-xl text-base text-bg-base/80 md:text-lg">
            Every saree we currently carry — silks, cottons, linens, designer drapes — sortable by
            price, fabric, occasion, and colour.
          </p>
          <Link
            href="/shop"
            className="mt-2 inline-flex items-center gap-2 rounded-sm bg-bg-base px-7 py-3.5 text-sm font-medium text-ink-900 transition hover:bg-bg-elevated"
          >
            Explore all sarees
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
