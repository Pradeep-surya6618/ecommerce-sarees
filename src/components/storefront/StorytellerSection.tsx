import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function StorytellerSection() {
  return (
    <section className="py-12 md:py-20">
      <Container size="xl">
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
            <h2 className="font-display text-2xl leading-tight text-ink-900 sm:text-3xl md:text-5xl">
              Slow-woven, by hand.
            </h2>
            <p className="text-sm text-ink-700 sm:text-base">
              Every saree in our edit is sourced directly from weavers across Kanchipuram, Varanasi,
              Paithan, and the looms of Bengal. We work with cooperatives that pay fairly and
              preserve heritage techniques that machines cannot match.
            </p>
            <p className="text-sm text-ink-700 sm:text-base">
              We&apos;re slow on purpose. New collections drop only when we find pieces that meet a
              bar most fashion houses skip.
            </p>
            <Link
              href="/about"
              className="mt-1 inline-flex w-fit items-center justify-center rounded-sm border border-ink-900 px-5 py-2.5 text-xs font-medium text-ink-900 transition hover:bg-ink-900 hover:text-white sm:mt-2 sm:px-6 sm:py-3 sm:text-sm"
            >
              Read our story
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
