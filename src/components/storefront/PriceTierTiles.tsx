import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Tier {
  label: string;
  caption: string;
  href: string;
  accent: string;
}

const TIERS: Tier[] = [
  {
    label: "Under ₹5,000",
    caption: "Everyday cottons and linens.",
    href: "/shop?maxPrice=500000",
    accent: "from-accent-gold/15",
  },
  {
    label: "₹5,000–₹15,000",
    caption: "Office and festive picks.",
    href: "/shop?minPrice=500000&maxPrice=1500000",
    accent: "from-accent-primary/10",
  },
  {
    label: "₹15,000–₹30,000",
    caption: "Handlooms and designer drapes.",
    href: "/shop?minPrice=1500000&maxPrice=3000000",
    accent: "from-success/10",
  },
  {
    label: "₹30,000 & above",
    caption: "Heirloom Kanjivarams and Paithanis.",
    href: "/shop?minPrice=3000000",
    accent: "from-warning/10",
  },
];

export function PriceTierTiles() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {TIERS.map((t) => (
        <Link
          key={t.label}
          href={t.href}
          className={`group relative flex flex-col gap-3 overflow-hidden rounded-md border border-ink-500/10 bg-gradient-to-br ${t.accent} to-bg-elevated p-6 transition hover:border-ink-900`}
        >
          <span className="text-xs uppercase tracking-[0.2em] text-ink-500">Shop by price</span>
          <h3 className="font-display text-2xl text-ink-900">{t.label}</h3>
          <p className="text-sm text-ink-700">{t.caption}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent-primary transition group-hover:text-accent-primary-hover">
            Explore
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ))}
    </div>
  );
}
