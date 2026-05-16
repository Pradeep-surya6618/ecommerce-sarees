import { clsx } from "@/lib/utils/clsx";

export interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Chip({ selected, onClick, children, className }: ChipProps) {
  const sharedClass = clsx(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition",
    selected
      ? "border-accent-primary bg-accent-primary text-white"
      : "border-ink-500/20 bg-bg-elevated text-ink-700 hover:border-ink-700",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={clsx(sharedClass, "cursor-pointer")}>
        {children}
      </button>
    );
  }
  return <span className={sharedClass}>{children}</span>;
}
