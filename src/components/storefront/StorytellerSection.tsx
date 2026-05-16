import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function StorytellerSection() {
  return (
    <section className="py-20">
      <Container size="xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md">
            <Image
              src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80"
              alt="Weaver hands at a handloom"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-5">
            <span className="text-xs uppercase tracking-[0.25em] text-accent-gold">Our craft</span>
            <h2 className="font-display text-3xl text-ink-900 md:text-5xl">
              Woven by hand, sourced with care.
            </h2>
            <p className="text-ink-700">
              Every saree in our edit is sourced directly from weavers across Kanchipuram, Varanasi,
              Paithan, and the looms of Bengal. We work with cooperatives that pay fairly and
              preserve heritage techniques that machines cannot match.
            </p>
            <p className="text-ink-700">
              We&apos;re slow on purpose. New collections drop only when we find pieces that meet a
              bar most fashion houses skip.
            </p>
            <Link
              href="/about"
              className="mt-2 inline-flex w-fit items-center justify-center rounded-sm border border-ink-900 px-6 py-3 text-sm font-medium text-ink-900 transition hover:bg-ink-900 hover:text-white"
            >
              Read our story
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
