import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

type MotifKind = "lotus" | "paisley" | "feather" | "mandala";

interface Tier {
  label: string;
  caption: string;
  href: string;
  motif: MotifKind;
  /** Soft radial glow color that hints at the tier without overwhelming the dark base. */
  glow: string;
}

const TIERS: Tier[] = [
  {
    label: "Under ₹5,000",
    caption: "Everyday cottons & linens.",
    href: "/shop?maxPrice=500000",
    motif: "lotus",
    glow: "bg-accent-gold/25",
  },
  {
    label: "₹5,000 – ₹15,000",
    caption: "Office & festive picks.",
    href: "/shop?minPrice=500000&maxPrice=1500000",
    motif: "paisley",
    glow: "bg-accent-primary/35",
  },
  {
    label: "₹15,000 – ₹30,000",
    caption: "Handlooms & designer drapes.",
    href: "/shop?minPrice=1500000&maxPrice=3000000",
    motif: "feather",
    glow: "bg-success/25",
  },
  {
    label: "₹30,000 & above",
    caption: "Heirloom Kanjivarams & Paithanis.",
    href: "/shop?minPrice=3000000",
    motif: "mandala",
    glow: "bg-accent-gold/30",
  },
];

export function PriceTierTiles() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {TIERS.map((t, idx) => (
        <Link
          key={t.label}
          href={t.href}
          className="group relative flex min-h-[260px] flex-col overflow-hidden rounded-md border border-white/8 bg-[#0d0e1c] p-6 text-bg-base transition duration-500 hover:-translate-y-0.5 hover:border-accent-gold/60 hover:shadow-elev"
        >
          {/* Top gold hairline */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/70 to-transparent"
          />

          {/* Per-tier corner glow — adds quiet color without lifting overall darkness */}
          <span
            aria-hidden
            className={clsx(
              "pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full blur-3xl",
              t.glow,
            )}
          />

          {/* Corner motif — saree art */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 text-accent-gold/45 transition-all duration-700 ease-out group-hover:rotate-[8deg] group-hover:scale-110 group-hover:text-accent-gold/70 md:h-36 md:w-36"
          >
            <Motif kind={t.motif} />
          </span>

          {/* Tier marker */}
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bg-base/70">
            Tier {String(idx + 1).padStart(2, "0")} · Price
          </span>

          {/* Price label */}
          <h3 className="mt-3 font-display text-[26px] leading-tight text-white md:text-[28px]">
            {t.label}
          </h3>

          {/* Gold flourish */}
          <span
            aria-hidden
            className="mt-3 h-px w-12 bg-gradient-to-r from-accent-gold to-transparent transition-all duration-500 group-hover:w-20"
          />

          {/* Caption */}
          <p className="mt-3 text-sm leading-relaxed text-bg-base/80">{t.caption}</p>

          {/* Explore CTA — white text for high contrast, gold arrow for accent */}
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-white transition-all group-hover:gap-3">
            Explore the edit
            <ArrowRight className="h-3.5 w-3.5 text-accent-gold transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

function Motif({ kind }: { kind: MotifKind }) {
  switch (kind) {
    case "lotus":
      return <LotusMotif />;
    case "paisley":
      return <PaisleyMotif />;
    case "feather":
      return <FeatherMotif />;
    case "mandala":
      return <MandalaMotif />;
  }
}

function LotusMotif() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <ellipse cx="50" cy="50" rx="9" ry="32" />
      <ellipse cx="50" cy="50" rx="9" ry="32" transform="rotate(45 50 50)" />
      <ellipse cx="50" cy="50" rx="9" ry="32" transform="rotate(-45 50 50)" />
      <ellipse cx="50" cy="50" rx="9" ry="32" transform="rotate(90 50 50)" />
      <circle cx="50" cy="50" r="4" fill="currentColor" />
    </svg>
  );
}

function PaisleyMotif() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M30 82 C18 62 24 32 50 22 C73 20 87 38 80 58 C75 71 60 80 50 74 C44 71 40 64 39 56" />
      <path d="M48 38 C55 38 60 42 60 50" />
      <circle cx="50" cy="32" r="2.5" fill="currentColor" />
    </svg>
  );
}

function FeatherMotif() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <ellipse cx="50" cy="32" rx="22" ry="16" />
      <ellipse cx="50" cy="32" rx="13" ry="9" />
      <ellipse cx="50" cy="32" rx="5" ry="4" fill="currentColor" />
      <path d="M50 48 Q50 70 46 88" />
      <path d="M50 48 Q52 70 56 88" opacity="0.5" />
    </svg>
  );
}

function MandalaMotif() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    >
      <circle cx="50" cy="50" r="32" />
      <circle cx="50" cy="50" r="22" />
      <circle cx="50" cy="50" r="12" />
      <circle cx="50" cy="50" r="3" fill="currentColor" />
      {[0, 30, 60, 90, 120, 150].map((angle) => (
        <line
          key={angle}
          x1="50"
          y1="18"
          x2="50"
          y2="82"
          transform={`rotate(${angle} 50 50)`}
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}
