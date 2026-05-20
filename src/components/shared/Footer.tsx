import Image from "next/image";
import Link from "next/link";
import {
  FacebookGlyph,
  InstagramGlyph,
  PinterestGlyph,
  WhatsAppGlyph,
  YoutubeGlyph,
} from "@/components/shared/icons";
import { Container } from "@/components/ui/Container";

const FOOTER_GROUPS = [
  {
    heading: "Shop",
    links: [
      { label: "All sarees", href: "/shop" },
      { label: "Silk", href: "/shop/silk" },
      { label: "Cotton", href: "/shop/cotton" },
      { label: "Linen", href: "/shop/linen" },
      { label: "Designer", href: "/shop/designer" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Shipping", href: "/policies/shipping" },
      { label: "Returns", href: "/policies/returns" },
      { label: "Saree care", href: "/policies/care" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Journal", href: "/blog" },
      { label: "Terms", href: "/policies/terms" },
      { label: "Privacy", href: "/policies/privacy" },
    ],
  },
  {
    heading: "Visit",
    links: [
      { label: "27 Lavelle Road", href: "/contact" },
      { label: "Bengaluru 560001", href: "/contact" },
      { label: "Mon – Sat · 11am – 8pm", href: "/contact" },
    ],
  },
];

const SOCIAL_LINKS = [
  { Icon: InstagramGlyph, label: "Instagram", href: "https://instagram.com" },
  { Icon: FacebookGlyph, label: "Facebook", href: "https://facebook.com" },
  { Icon: PinterestGlyph, label: "Pinterest", href: "https://pinterest.com" },
  { Icon: YoutubeGlyph, label: "YouTube", href: "https://youtube.com" },
  { Icon: WhatsAppGlyph, label: "WhatsApp", href: "https://wa.me/" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink-900 text-bg-base">
      {/* Full-bleed saree photograph as ambient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=2000&q=80"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="object-cover opacity-20"
        />
        {/* Deep gradient overlay so content reads on top */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900 via-ink-900/92 to-ink-900" />
      </div>

      {/* Top brass hairline */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/55 to-transparent"
      />

      <Container size="xl" className="relative">
        {/* ── Brand block (centered, editorial) ── */}
        <div className="flex flex-col items-center gap-5 py-16 text-center md:py-20">
          <span aria-hidden className="text-accent-gold/70">
            ✦
          </span>
          <h2 className="font-display text-4xl leading-none text-bg-base sm:text-5xl md:text-6xl">
            Saree Store
          </h2>
          <span
            aria-hidden
            className="h-px w-16 bg-gradient-to-r from-transparent via-accent-gold to-transparent"
          />
          <p className="max-w-xl text-sm leading-relaxed text-bg-base/75 sm:text-base">
            Handpicked sarees from looms across India. Slow fashion, fairly sourced — each weave
            chosen for its story, not the season.
          </p>

          {/* Newsletter */}
          <form className="mt-4 flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <input
              type="email"
              placeholder="Your email — first looks, drop notices, editorial notes"
              className="flex-1 rounded-sm border border-bg-base/20 bg-white/[0.04] px-4 py-3 text-sm text-bg-base placeholder:text-bg-base/45 focus:border-accent-gold focus:outline-none"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-sm bg-accent-gold px-5 py-3 text-sm font-medium uppercase tracking-[0.15em] text-ink-900 transition hover:bg-accent-gold/85"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* ── Ornamental divider ── */}
        <div className="flex items-center justify-center gap-4 pb-10">
          <span aria-hidden className="h-px flex-1 max-w-[180px] bg-bg-base/15" />
          <span aria-hidden className="text-accent-gold/70">
            ✦
          </span>
          <span aria-hidden className="h-px flex-1 max-w-[180px] bg-bg-base/15" />
        </div>

        {/* ── Link columns ── */}
        <div className="grid grid-cols-2 gap-y-10 gap-x-8 pb-12 sm:grid-cols-4">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.heading} className="flex flex-col gap-4 text-center sm:text-left">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-gold">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-2.5 text-sm text-bg-base/75">
                {group.links.map((link) => (
                  <li key={`${group.heading}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="group relative inline-block transition hover:text-bg-base"
                    >
                      {link.label}
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 left-0 h-[1px] w-0 bg-accent-gold transition-all duration-300 group-hover:w-full"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Social row + ornaments ── */}
        <div className="flex flex-col items-center gap-5 border-t border-bg-base/10 pt-10 pb-8">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-px w-10 bg-accent-gold/50" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-accent-gold">
              Follow our looms
            </span>
            <span aria-hidden className="h-px w-10 bg-accent-gold/50" />
          </div>
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-bg-base/20 bg-white/[0.04] text-bg-base/80 transition hover:border-accent-gold hover:bg-accent-gold/10 hover:text-accent-gold"
              >
                <Icon className="h-[16px] w-[16px]" />
              </Link>
            ))}
          </div>
        </div>
      </Container>

      {/* Bottom brass hairline */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-[44px] h-px bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent sm:bottom-[40px]"
      />

      {/* ── Copyright bar ── */}
      <Container size="xl" className="relative">
        <div className="flex flex-col items-center gap-2 py-5 text-xs text-bg-base/55 sm:flex-row sm:justify-between">
          <span>© 2026 Saree Store. Crafted in India.</span>
          <span className="inline-flex items-center gap-2 font-display italic text-accent-gold/80">
            Slow-woven. Fairly sourced.
          </span>
        </div>
      </Container>
    </footer>
  );
}
