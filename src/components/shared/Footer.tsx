import Image from "next/image";
import Link from "next/link";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { contentPagesRepo } from "@/lib/db/repos/content-pages";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import {
  FacebookGlyph,
  InstagramGlyph,
  PinterestGlyph,
  WhatsAppGlyph,
  YoutubeGlyph,
} from "@/components/shared/icons";
import { Container } from "@/components/ui/Container";
import type { Category, ContentPage, SocialLinks, VisitSettings } from "@/types/domain";

interface FooterLink {
  label: string;
  href: string;
}

const ALL_SAREES_LINK: FooterLink = { label: "All sarees", href: "/shop" };

function categoriesToFooterLinks(categories: Category[]): FooterLink[] {
  // "All sarees" always first; then up to 4 top-level categories by sortOrder
  // so the column stays compact even as the admin adds more.
  const fromAdmin = categories.slice(0, 4).map((c) => ({ label: c.name, href: `/shop/${c.slug}` }));
  return [ALL_SAREES_LINK, ...fromAdmin];
}

function visitToFooterLinks(visit: VisitSettings): FooterLink[] {
  // Default to /contact when the admin hasn't set a href but has filled in
  // any visit info — the column is otherwise hidden entirely (see Footer).
  const href = visit.href || "/contact";
  const lines = [visit.addressLine1, visit.addressLine2, visit.hours].filter(
    (s) => s.trim().length > 0,
  );
  return lines.map((label) => ({ label, href }));
}

function pageHref(p: ContentPage): string {
  return p.externalHref ?? `/p/${p.slug}`;
}

function toFooterLinks(pages: ContentPage[]): FooterLink[] {
  return pages.map((p) => ({ label: p.footerLabel || p.title, href: pageHref(p) }));
}

interface SocialEntry {
  Icon: typeof InstagramGlyph;
  label: string;
  key: keyof SocialLinks;
  hoverClass: string;
}

const SOCIAL_ENTRIES: SocialEntry[] = [
  {
    Icon: InstagramGlyph,
    label: "Instagram",
    key: "instagram",
    hoverClass: "hover:border-[#E1306C] hover:bg-[#E1306C] hover:text-white",
  },
  {
    Icon: FacebookGlyph,
    label: "Facebook",
    key: "facebook",
    hoverClass: "hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white",
  },
  {
    Icon: PinterestGlyph,
    label: "Pinterest",
    key: "pinterest",
    hoverClass: "hover:border-[#E60023] hover:bg-[#E60023] hover:text-white",
  },
  {
    Icon: YoutubeGlyph,
    label: "YouTube",
    key: "youtube",
    hoverClass: "hover:border-[#FF0000] hover:bg-[#FF0000] hover:text-white",
  },
  {
    Icon: WhatsAppGlyph,
    label: "WhatsApp",
    key: "whatsapp",
    hoverClass: "hover:border-[#25D366] hover:bg-[#25D366] hover:text-white",
  },
];

export async function Footer() {
  const [topCategories, helpPages, companyPages, settings] = await Promise.all([
    categoriesRepo.listTopLevel(),
    contentPagesRepo.listByGroup("help"),
    contentPagesRepo.listByGroup("company"),
    siteSettingsRepo.get(),
  ]);

  const visitLinks = visitToFooterLinks(settings.visit);

  const footerGroups: { heading: string; links: FooterLink[] }[] = [
    { heading: "Shop", links: categoriesToFooterLinks(topCategories) },
    { heading: "Help", links: toFooterLinks(helpPages) },
    { heading: "Company", links: toFooterLinks(companyPages) },
    // Visit column is hidden completely when the admin hasn't filled in any
    // of the address/hours fields.
    ...(visitLinks.length > 0 ? [{ heading: "Visit", links: visitLinks }] : []),
  ];

  // Only render icons for platforms with a saved URL. If none are set the
  // whole "Follow our looms" block disappears (rendered conditionally below).
  const visibleSocial = SOCIAL_ENTRIES.flatMap((entry) => {
    const href = settings.social[entry.key]?.trim();
    return href ? [{ ...entry, href }] : [];
  });
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

        {/* ── Social row + ornaments — hidden until the admin sets at least one link ── */}
        {visibleSocial.length > 0 && (
          <div className="flex flex-col items-center gap-4 border-t border-bg-base/10 pt-6 pb-6 sm:gap-5 sm:pt-10 sm:pb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <span aria-hidden className="h-px w-6 bg-accent-gold/50 sm:w-10" />
              <span className="text-[9px] uppercase tracking-[0.3em] text-accent-gold sm:text-[10px] sm:tracking-[0.35em]">
                Follow our looms
              </span>
              <span aria-hidden className="h-px w-6 bg-accent-gold/50 sm:w-10" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {visibleSocial.map(({ Icon, label, href, hoverClass }) => (
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
        )}
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
                unoptimized
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
