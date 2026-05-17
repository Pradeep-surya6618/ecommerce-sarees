import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export type PageWindowEntry = number | "...";

export function computePageWindow(current: number, total: number): PageWindowEntry[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: PageWindowEntry[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("...");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("...");
  out.push(total);
  return out;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}

export function Pagination({ currentPage, totalPages, buildHref, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const window = computePageWindow(currentPage, totalPages);
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={clsx("flex items-center justify-center gap-1", className)}
    >
      <Link
        aria-label="Previous page"
        aria-disabled={prevDisabled}
        href={prevDisabled ? "#" : buildHref(currentPage - 1)}
        className={clsx(
          "inline-flex h-9 w-9 items-center justify-center rounded-sm border border-ink-500/20 text-ink-700 transition",
          prevDisabled ? "pointer-events-none opacity-40" : "hover:border-ink-700",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {window.map((entry, idx) =>
        entry === "..." ? (
          <span key={`gap-${idx}`} aria-hidden className="px-2 text-ink-500">
            …
          </span>
        ) : (
          <Link
            key={entry}
            aria-label={`Page ${entry}`}
            aria-current={entry === currentPage ? "page" : undefined}
            href={buildHref(entry)}
            className={clsx(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-sm border px-3 text-sm transition",
              entry === currentPage
                ? "border-accent-primary bg-accent-primary text-white"
                : "border-ink-500/20 text-ink-700 hover:border-ink-700",
            )}
          >
            {entry}
          </Link>
        ),
      )}
      <Link
        aria-label="Next page"
        aria-disabled={nextDisabled}
        href={nextDisabled ? "#" : buildHref(currentPage + 1)}
        className={clsx(
          "inline-flex h-9 w-9 items-center justify-center rounded-sm border border-ink-500/20 text-ink-700 transition",
          nextDisabled ? "pointer-events-none opacity-40" : "hover:border-ink-700",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
