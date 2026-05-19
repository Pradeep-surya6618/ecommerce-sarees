import Image from "next/image";
import Link from "next/link";
import { SareeMotifBg } from "@/components/storefront/SareeMotifBg";
import { Container } from "@/components/ui/Container";

export function StorytellerSection() {
  return (
    <section className="relative overflow-hidden bg-accent-primary py-12 text-bg-base md:py-20">
      {/* Saree motif backdrop */}
      <SareeMotifBg id="storyteller" variant="floral" className="text-accent-gold opacity-[0.28]" />
      {/* Top + bottom brass hairlines */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/50 to-transparent"
      />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent"
      />
      <Container size="xl" className="relative">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md">
            <Image
              src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80"
              alt="Weaver hands at a handloom"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-3 sm:gap-5">
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent-gold sm:text-xs">
              Our craft
            </span>
            <h2 className="font-display text-2xl leading-tight text-bg-base sm:text-3xl md:text-5xl">
              Slow-woven, by hand.
            </h2>
            <span
              aria-hidden
              className="h-px w-12 bg-gradient-to-r from-accent-gold to-transparent"
            />
            <p className="text-sm text-bg-base/85 sm:text-base">
              Every saree in our edit is sourced directly from weavers across Kanchipuram, Varanasi,
              Paithan, and the looms of Bengal. We work with cooperatives that pay fairly and
              preserve heritage techniques that machines cannot match.
            </p>
            <p className="text-sm text-bg-base/85 sm:text-base">
              We&apos;re slow on purpose. New collections drop only when we find pieces that meet a
              bar most fashion houses skip.
            </p>
            <Link
              href="/about"
              className="mt-1 inline-flex w-fit items-center justify-center rounded-sm border border-bg-base/80 px-5 py-2.5 text-xs font-medium text-bg-base transition hover:bg-bg-base hover:text-accent-primary sm:mt-2 sm:px-6 sm:py-3 sm:text-sm"
            >
              Read our story
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
