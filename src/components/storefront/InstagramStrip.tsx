import Image from "next/image";
import Link from "next/link";
import { InstagramGlyph } from "@/components/shared/icons";
import { Container } from "@/components/ui/Container";
import type { InstagramSettings } from "@/types/domain";

export function InstagramStrip({ settings }: { settings: InstagramSettings }) {
  if (!settings.enabled) return null;
  const tiles = settings.tiles.filter((t) => t.visible && t.imageUrl);
  if (tiles.length === 0) return null;

  return (
    <section className="py-12 md:py-20">
      <Container size="xl">
        {/* Heading */}
        <header className="mb-8 flex flex-col items-center gap-3 text-center md:mb-12">
          <Link
            href={settings.ctaHref}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-accent-gold transition hover:text-accent-primary sm:text-xs"
          >
            <InstagramGlyph className="h-3.5 w-3.5" />
            {settings.handle}
          </Link>
          <h2 className="font-display text-2xl leading-tight text-ink-900 sm:text-3xl md:text-4xl">
            From the gram
          </h2>
          <span
            aria-hidden
            className="h-px w-12 bg-gradient-to-r from-transparent via-accent-gold to-transparent"
          />
        </header>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:grid-cols-6">
          {tiles.map((t) => (
            <Link
              key={t.id}
              href={t.href || settings.ctaHref}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`Open Instagram post ${t.id}`}
              className="group relative aspect-square overflow-hidden rounded-sm bg-ink-500/10"
            >
              <Image
                src={t.imageUrl}
                alt=""
                fill
                sizes="(min-width: 768px) 16vw, 33vw"
                className="object-cover transition duration-700 ease-out group-hover:scale-110"
              />
              {/* Hover dark veil */}
              <span
                aria-hidden
                className="absolute inset-0 bg-ink-900/0 transition duration-300 group-hover:bg-ink-900/55"
              />
              {/* Instagram icon — fades + scales in on hover */}
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100"
              >
                <span className="inline-flex h-9 w-9 scale-75 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition duration-300 group-hover:scale-100">
                  <InstagramGlyph className="h-4 w-4" />
                </span>
              </span>
            </Link>
          ))}
        </div>

        {/* Follow CTA */}
        <div className="mt-8 flex justify-center md:mt-10">
          <Link
            href={settings.ctaHref}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-sm border border-ink-900 px-5 py-2.5 text-xs font-medium text-ink-900 transition hover:bg-ink-900 hover:text-white sm:px-6 sm:py-3 sm:text-sm"
          >
            <InstagramGlyph className="h-4 w-4" />
            Follow on Instagram
          </Link>
        </div>
      </Container>
    </section>
  );
}
