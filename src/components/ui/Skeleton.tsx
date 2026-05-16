import { clsx } from "@/lib/utils/clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("animate-pulse rounded-sm bg-ink-500/10", className)} />;
}
