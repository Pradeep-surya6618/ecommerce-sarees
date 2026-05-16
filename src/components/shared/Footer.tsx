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
    <footer className="mt-24 border-t border-ink-500/10 bg-bg-elevated">
      <Container size="xl">
        <div className="grid gap-10 py-16 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <span className="font-display text-2xl text-ink-900">Saree Store</span>
            <p className="text-sm text-ink-700">
              Handpicked sarees from looms across India. Slow fashion, fairly sourced.
            </p>
            <form className="mt-4 flex max-w-sm gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 rounded-sm border border-ink-500/20 bg-bg-base px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-700"
              >
                Subscribe
              </button>
            </form>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-900">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-ink-700">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-ink-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-500/10 py-6 text-xs text-ink-500">
          © 2026 Saree Store. Crafted in India.
        </div>
      </Container>
    </footer>
  );
}
