import { clsx } from "@/lib/utils/clsx";

type Tone = "neutral" | "accent" | "gold" | "success" | "success-solid" | "warning" | "danger";

export interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

const toneClass: Record<Tone, string> = {
  neutral: "bg-bg-elevated text-ink-700 border border-ink-500/20",
  accent: "bg-accent-primary text-white",
  gold: "bg-accent-gold text-white",
  success: "bg-success/10 text-success border border-success/20",
  "success-solid": "bg-success text-white",
  warning: "bg-warning/10 text-warning border border-warning/30",
  danger: "bg-danger/10 text-danger border border-danger/30",
};

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
