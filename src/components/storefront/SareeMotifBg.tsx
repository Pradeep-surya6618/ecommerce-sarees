import { clsx } from "@/lib/utils/clsx";

export type SareeMotif = "paisley" | "floral" | "weave" | "lotus" | "diamond" | "star" | "temple";

export interface SareeMotifBgProps {
  /** Unique id (so multiple instances on one page don't collide on SVG <defs>). */
  id: string;
  variant?: SareeMotif;
  /** Tile size in px. Larger = motifs more spread out / fewer per viewport. Default 120. */
  tileSize?: number;
  className?: string;
}

/**
 * Decorative full-bleed background of repeating Indian textile motifs.
 * Inherits color via `currentColor`, so set tint + opacity through `className`
 * (e.g. `text-ink-900 opacity-[0.06]` or `text-accent-gold opacity-15`).
 */
export function SareeMotifBg({
  id,
  variant = "paisley",
  tileSize = 120,
  className,
}: SareeMotifBgProps) {
  const patternId = `saree-motif-${id}`;
  return (
    <svg
      aria-hidden
      className={clsx("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      <defs>
        <pattern id={patternId} width={tileSize} height={tileSize} patternUnits="userSpaceOnUse">
          <MotifTile variant={variant} size={tileSize} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

function MotifTile({ variant, size }: { variant: SareeMotif; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  switch (variant) {
    case "paisley":
      return <PaisleyTile cx={cx} cy={cy} />;
    case "floral":
      return <FloralTile cx={cx} cy={cy} />;
    case "weave":
      return <WeaveTile size={size} />;
    case "lotus":
      return <LotusTile cx={cx} cy={cy} />;
    case "diamond":
      return <DiamondTile cx={cx} cy={cy} />;
    case "star":
      return <StarTile cx={cx} cy={cy} />;
    case "temple":
      return <TempleTile cx={cx} cy={cy} />;
  }
}

function PaisleyTile({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g
      transform={`translate(${cx - 60} ${cy - 60})`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M30 90 C16 70 22 38 58 28 C84 26 96 50 86 70 C80 82 64 90 54 85 C48 82 46 74 45 66" />
      <path d="M52 50 C58 50 62 54 62 60" />
      <circle cx="58" cy="40" r="2.2" fill="currentColor" />
    </g>
  );
}

function FloralTile({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`} fill="none" stroke="currentColor" strokeWidth="1.3">
      <ellipse cx="0" cy="-18" rx="4.5" ry="12" />
      <ellipse cx="0" cy="-18" rx="4.5" ry="12" transform="rotate(72)" />
      <ellipse cx="0" cy="-18" rx="4.5" ry="12" transform="rotate(144)" />
      <ellipse cx="0" cy="-18" rx="4.5" ry="12" transform="rotate(216)" />
      <ellipse cx="0" cy="-18" rx="4.5" ry="12" transform="rotate(288)" />
      <circle cx="0" cy="0" r="2.8" fill="currentColor" />
    </g>
  );
}

function WeaveTile({ size }: { size: number }) {
  const step = size / 6;
  const horiz = [1, 2, 3, 4, 5].map((i) => i * step);
  return (
    <g stroke="currentColor" fill="none">
      <g strokeWidth="0.9">
        {horiz.map((y) => (
          <line key={`h-${y}`} x1="0" y1={y} x2={size} y2={y} />
        ))}
      </g>
      <g strokeWidth="0.8" strokeDasharray="4 4">
        {horiz.map((x) => (
          <line key={`v-${x}`} x1={x} y1="0" x2={x} y2={size} />
        ))}
      </g>
    </g>
  );
}

function LotusTile({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`} fill="none" stroke="currentColor" strokeWidth="1.3">
      <ellipse cx="0" cy="0" rx="4.5" ry="22" />
      <ellipse cx="0" cy="0" rx="4.5" ry="22" transform="rotate(30)" />
      <ellipse cx="0" cy="0" rx="4.5" ry="22" transform="rotate(60)" />
      <ellipse cx="0" cy="0" rx="4.5" ry="22" transform="rotate(90)" />
      <ellipse cx="0" cy="0" rx="4.5" ry="22" transform="rotate(120)" />
      <ellipse cx="0" cy="0" rx="4.5" ry="22" transform="rotate(150)" />
      <circle cx="0" cy="0" r="3.2" fill="currentColor" />
    </g>
  );
}

function DiamondTile({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g
      transform={`translate(${cx} ${cy})`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    >
      {/* Outer diamond */}
      <path d="M0 -28 L28 0 L0 28 L-28 0 Z" />
      {/* Inner diamond */}
      <path d="M0 -14 L14 0 L0 14 L-14 0 Z" />
      {/* Center dot */}
      <circle cx="0" cy="0" r="2.6" fill="currentColor" />
    </g>
  );
}

function TempleTile({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g
      transform={`translate(${cx} ${cy})`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    >
      {/* Four temple-tip triangles facing outward — saree border motif */}
      <path d="M0 -26 L10 -10 L-10 -10 Z" />
      <path d="M26 0 L10 10 L10 -10 Z" />
      <path d="M0 26 L-10 10 L10 10 Z" />
      <path d="M-26 0 L-10 -10 L-10 10 Z" />
      {/* Center jewel */}
      <circle cx="0" cy="0" r="3" fill="currentColor" />
    </g>
  );
}

function StarTile({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g
      transform={`translate(${cx} ${cy})`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    >
      {/* 8-point zari star */}
      <path d="M0 -22 L6 -6 L22 0 L6 6 L0 22 L-6 6 L-22 0 L-6 -6 Z" />
      {/* Inner star */}
      <path d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z" />
      <circle cx="0" cy="0" r="1.6" fill="currentColor" />
    </g>
  );
}
