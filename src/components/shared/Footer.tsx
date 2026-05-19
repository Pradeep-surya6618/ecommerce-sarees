import Link from "next/link";
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
];

export function Footer() {
  return (
    <footer className="bg-ink-900 text-bg-base">
      <Container size="xl">
        <div className="grid gap-10 py-16 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="font-display text-2xl text-bg-base">Saree Store</span>
              <span
                aria-hidden
                className="mt-1.5 h-px w-10 bg-gradient-to-r from-accent-gold to-transparent"
              />
            </div>
            <p className="mt-1 text-sm text-bg-base/75">
              Handpicked sarees from looms across India. Slow fashion, fairly sourced.
            </p>
            <form className="mt-4 flex max-w-sm gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 rounded-sm border border-bg-base/20 bg-white/[0.06] px-3 py-2 text-sm text-bg-base placeholder:text-bg-base/45 focus:border-accent-gold focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-sm bg-accent-gold px-4 py-2 text-sm font-medium text-ink-900 transition hover:bg-accent-gold/85"
              >
                Subscribe
              </button>
            </form>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent-gold">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-bg-base/75">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-bg-base">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-bg-base/15 py-6 text-xs text-bg-base/55">
          © 2026 Saree Store. Crafted in India.
        </div>
      </Container>
    </footer>
  );
}
