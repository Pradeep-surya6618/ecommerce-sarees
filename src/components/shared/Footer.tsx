import Image from "next/image";
import Link from "next/link";
import { contentPagesRepo } from "@/lib/db/repos/content-pages";
import {
  FacebookGlyph,
  InstagramGlyph,
  PinterestGlyph,
  WhatsAppGlyph,
  YoutubeGlyph,
} from "@/components/shared/icons";
import { Container } from "@/components/ui/Container";
import type { ContentPage } from "@/types/domain";

interface FooterLink {
  label: string;
  href: string;
}

const SHOP_LINKS: FooterLink[] = [
  { label: "All sarees", href: "/shop" },
  { label: "Silk", href: "/shop/silk" },
  { label: "Cotton", href: "/shop/cotton" },
  { label: "Linen", href: "/shop/linen" },
  { label: "Designer", href: "/shop/designer" },
];

const VISIT_LINKS: FooterLink[] = [
  { label: "27 Lavelle Road", href: "/p/contact" },
  { label: "Bengaluru 560001", href: "/p/contact" },
  { label: "Mon – Sat · 11am – 8pm", href: "/p/contact" },
];

function pageHref(p: ContentPage): string {
  return p.externalHref ?? `/p/${p.slug}`;
}

function toFooterLinks(pages: ContentPage[]): FooterLink[] {
  return pages.map((p) => ({ label: p.footerLabel || p.title, href: pageHref(p) }));
}

const SOCIAL_LINKS = [
  {
    Icon: InstagramGlyph,
    label: "Instagram",
    href: "https://instagram.com",
    hoverClass: "hover:border-[#E1306C] hover:bg-[#E1306C] hover:text-white",
  },
  {
    Icon: FacebookGlyph,
    label: "Facebook",
    href: "https://facebook.com",
    hoverClass: "hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white",
  },
  {
    Icon: PinterestGlyph,
    label: "Pinterest",
    href: "https://pinterest.com",
    hoverClass: "hover:border-[#E60023] hover:bg-[#E60023] hover:text-white",
  },
  {
    Icon: YoutubeGlyph,
    label: "YouTube",
    href: "https://youtube.com",
    hoverClass: "hover:border-[#FF0000] hover:bg-[#FF0000] hover:text-white",
  },
  {
    Icon: WhatsAppGlyph,
    label: "WhatsApp",
    href: "https://wa.me/",
    hoverClass: "hover:border-[#25D366] hover:bg-[#25D366] hover:text-white",
  },
];

export async function Footer() {
  const [helpPages, companyPages] = await Promise.all([
    contentPagesRepo.listByGroup("help"),
    contentPagesRepo.listByGroup("company"),
  ]);

  const footerGroups: { heading: string; links: FooterLink[] }[] = [
    { heading: "Shop", links: SHOP_LINKS },
    { heading: "Help", links: toFooterLinks(helpPages) },
    { heading: "Company", links: toFooterLinks(companyPages) },
    { heading: "Visit", links: VISIT_LINKS },
  ];
  return (
    <footer className="relative overflow-hidden bg-ink-900 text-bg-base">
      {/* Full-bleed saree photograph as ambient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/Images/Saree-2.png"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="object-cover opacity-60"
          priority={false}
        />
        {/* Purple-tinted gradient overlay so content reads cleanly on top */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/70 via-ink-900/55 to-ink-900/75" />
        {/* Soft vignette pushing focus toward the centered brand block */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#251f3e_85%)]" />
      </div>

      {/* Top brass hairline */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/55 to-transparent"
      />

      <Container size="xl" className="relative">
        {/* ── Brand block (centered, editorial) ── */}
        <div className="flex flex-col items-center gap-3 py-10 text-center sm:gap-5 sm:py-16 md:py-20">
          <span aria-hidden className="text-xs text-accent-gold/70 sm:text-base">
            ✦
          </span>
          <h2 className="font-display text-3xl leading-none text-bg-base sm:text-5xl md:text-6xl">
            Saree Store
          </h2>
          <span
            aria-hidden
            className="h-px w-10 bg-gradient-to-r from-transparent via-accent-gold to-transparent sm:w-16"
          />
          <p className="max-w-xl text-xs leading-relaxed text-bg-base/75 sm:text-sm md:text-base">
            Handpicked sarees from looms across India. Slow fashion, fairly sourced — each weave
            chosen for its story, not the season.
          </p>

          {/* Newsletter */}
          <form className="mt-2 flex w-full max-w-md flex-col gap-2 sm:mt-4 sm:flex-row">
            <input
              type="email"
              placeholder="Your email"
              className="autofill-on-dark flex-1 rounded-sm border border-bg-base/20 bg-white/[0.04] px-3 py-2.5 text-xs text-bg-base placeholder:text-bg-base/45 focus:border-accent-gold focus:outline-none sm:px-4 sm:py-3 sm:text-sm"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-sm bg-accent-gold px-4 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-ink-900 transition hover:bg-accent-gold/85 sm:px-5 sm:py-3 sm:text-sm"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* ── Ornamental divider ── */}
        <div className="flex items-center justify-center gap-3 pb-6 sm:gap-4 sm:pb-10">
          <span aria-hidden className="h-px max-w-[120px] flex-1 bg-bg-base/15 sm:max-w-[180px]" />
          <span aria-hidden className="text-xs text-accent-gold/70 sm:text-base">
            ✦
          </span>
          <span aria-hidden className="h-px max-w-[120px] flex-1 bg-bg-base/15 sm:max-w-[180px]" />
        </div>

        {/* ── Link columns ── */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-6 pb-8 sm:grid-cols-4 sm:gap-y-10 sm:gap-x-8 sm:pb-12">
          {footerGroups.map((group) => (
            <div
              key={group.heading}
              className="flex flex-col gap-3 text-center sm:gap-4 sm:text-left"
            >
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[11px]">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-2 text-xs text-bg-base/75 sm:gap-2.5 sm:text-sm">
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
        <div className="flex flex-col items-center gap-4 border-t border-bg-base/10 pt-6 pb-6 sm:gap-5 sm:pt-10 sm:pb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <span aria-hidden className="h-px w-6 bg-accent-gold/50 sm:w-10" />
            <span className="text-[9px] uppercase tracking-[0.3em] text-accent-gold sm:text-[10px] sm:tracking-[0.35em]">
              Follow our looms
            </span>
            <span aria-hidden className="h-px w-6 bg-accent-gold/50 sm:w-10" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {SOCIAL_LINKS.map(({ Icon, label, href, hoverClass }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-bg-base/20 bg-white/[0.04] text-bg-base/80 transition sm:h-10 sm:w-10 ${hoverClass}`}
              >
                <Icon className="h-[14px] w-[14px] sm:h-[16px] sm:w-[16px]" />
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
          <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 sm:justify-start">
            <span>© {new Date().getFullYear()} Saree Store. Crafted by</span>
            <a
              href="https://incrix.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Incrix"
              className="inline-flex items-center transition hover:opacity-90"
            >
              <Image
                src="/Images/Incrix-Logo.png"
                alt="Incrix"
                width={56}
                height={16}
                className="h-3.5 w-auto object-contain sm:h-4"
              />
            </a>
          </span>
          <span className="inline-flex items-center gap-2 font-display italic text-accent-gold/80">
            Slow-woven. Fairly sourced.
          </span>
        </div>
      </Container>
    </footer>
  );
}
