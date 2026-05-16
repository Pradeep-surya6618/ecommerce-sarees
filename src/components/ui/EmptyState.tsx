import type { ReactNode } from "react";
import { clsx } from "@/lib/utils/clsx";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-ink-500/20 bg-bg-elevated px-6 py-16 text-center",
        className,
      )}
    >
      <h3 className="font-display text-2xl text-ink-900">{title}</h3>
      {description && <p className="max-w-md text-sm text-ink-700">{description}</p>}
      {action}
    </div>
  );
}
