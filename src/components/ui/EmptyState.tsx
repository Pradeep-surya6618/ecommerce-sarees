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
        "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-ink-500/20 bg-bg-elevated px-5 py-10 text-center sm:gap-3 sm:px-6 sm:py-16",
        className,
      )}
    >
      <h3 className="font-display text-base leading-tight text-ink-900 sm:text-xl md:text-2xl">
        {title}
      </h3>
      {description && (
        <p className="max-w-md text-[11px] leading-relaxed text-ink-700 sm:text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-1 sm:mt-2">{action}</div>}
    </div>
  );
}
