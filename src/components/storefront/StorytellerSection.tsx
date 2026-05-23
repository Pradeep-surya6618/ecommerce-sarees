import Image from "next/image";
import Link from "next/link";
import { SareeMotifBg } from "@/components/storefront/SareeMotifBg";
import { Container } from "@/components/ui/Container";
import type { AboutPageContent } from "@/types/domain";

export interface StorytellerSectionProps {
  about: AboutPageContent;
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function StorytellerSection({ about }: StorytellerSectionProps) {
  // Hide the whole section when the admin hasn't filled in any of it yet —
  // the home page shouldn't render a half-empty story block.
  const hasAnyContent =
    about.title.trim() ||
    about.description.trim() ||
    about.introBody.trim() ||
    about.imageUrl.trim();
  if (!hasAnyContent) return null;

  const introParas = paragraphs(about.introBody);
  const teaserParas = about.description.trim() ? [about.description.trim()] : introParas;

  return (
    <section className="relative overflow-hidden bg-accent-primary py-12 text-bg-base md:py-20">
      <SareeMotifBg id="storyteller" variant="floral" className="text-accent-gold opacity-[0.28]" />
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
            {about.imageUrl ? (
              <Image
                src={about.imageUrl}
                alt={about.imageAlt || about.title || "Our craft"}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              // Placeholder for admins who haven't uploaded an About image yet.
              // Uses the brand gradient + motif so the layout doesn't collapse.
              <div
                aria-hidden
                className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-primary-hover via-accent-primary to-ink-900"
              >
                <SareeMotifBg
                  id="storyteller-placeholder"
                  variant="diamond"
                  className="text-accent-gold opacity-30"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:gap-5">
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent-gold sm:text-xs">
              Our craft
            </span>
            <h2 className="font-display text-2xl leading-tight text-bg-base sm:text-3xl md:text-5xl">
              {about.title || "Slow-woven, by hand."}
            </h2>
            <span
              aria-hidden
              className="h-px w-12 bg-gradient-to-r from-accent-gold to-transparent"
            />
            {teaserParas.length > 0 ? (
              teaserParas.slice(0, 2).map((p, i) => (
                <p key={i} className="text-sm text-bg-base/85 sm:text-base">
                  {p}
                </p>
              ))
            ) : (
              <p className="text-sm italic text-bg-base/60 sm:text-base">
                Tell your craft story — set it in Admin → About.
              </p>
            )}
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
