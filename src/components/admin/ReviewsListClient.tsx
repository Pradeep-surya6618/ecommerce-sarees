"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { BadgeCheck, MessageSquareQuote, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import { adminDeleteReviewAction } from "@/server/actions/admin-reviews";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Review } from "@/types/domain";

export interface AdminReviewRow extends Review {
  productName: string;
  productSlug: string | null;
}

interface Props {
  reviews: AdminReviewRow[];
}

type StarFilter = "" | "1" | "2" | "3" | "4" | "5";

const STAR_PILLS: { value: StarFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "5", label: "5★" },
  { value: "4", label: "4★" },
  { value: "3", label: "3★" },
  { value: "2", label: "2★" },
  { value: "1", label: "1★" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReviewsListClient({ reviews }: Props) {
  const [query, setQuery] = useState("");
  const [stars, setStars] = useState<StarFilter>("");
  const [pendingDelete, startDelete] = useTransition();
  const [target, setTarget] = useState<AdminReviewRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      if (stars && String(r.rating) !== stars) return false;
      if (!q) return true;
      return (
        r.authorName.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q) ||
        (r.title?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [reviews, query, stars]);

  const hasFilters = Boolean(query) || Boolean(stars);

  function countFor(value: StarFilter): number {
    if (value === "") return reviews.length;
    return reviews.filter((r) => String(r.rating) === value).length;
  }

  function confirmDelete() {
    if (!target || !target.productId || !target.userId) {
      setTarget(null);
      return;
    }
    const row = target;
    startDelete(async () => {
      try {
        const result = await adminDeleteReviewAction(row.productId!, row.userId!);
        setTarget(null);
        if (!result.ok) {
          toast.error("Couldn't delete the review", { description: result.error });
          return;
        }
        toast.success("Review removed", { description: `${row.authorName}'s review was deleted.` });
      } catch {
        setTarget(null);
        toast.error("Couldn't delete the review. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Reviews</h1>
          <p className="text-[11px] text-ink-700 sm:text-sm">
            {hasFilters
              ? `${filtered.length} of ${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`
              : `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"} · delete spam or abusive ones`}
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by author, product or text…"
            className="autofill-on-light h-10 w-full rounded-full border border-ink-500/15 bg-bg-elevated pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary focus:bg-white sm:h-11"
          />
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
          {STAR_PILLS.map((pill) => {
            const active = stars === pill.value;
            return (
              <button
                key={pill.value || "all"}
                type="button"
                onClick={() => setStars(pill.value)}
                className={clsx(
                  "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition sm:h-8 sm:text-xs",
                  active
                    ? "border-accent-primary bg-accent-primary text-white"
                    : "border-ink-500/15 bg-bg-elevated text-ink-700 hover:border-accent-primary hover:text-accent-primary",
                )}
              >
                {pill.label}
                <span
                  className={clsx(
                    "font-mono text-[9px] tabular-nums",
                    active ? "text-white/80" : "text-ink-500",
                  )}
                >
                  {countFor(pill.value)}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-500/10 text-ink-500">
            <MessageSquareQuote className="h-5 w-5" />
          </div>
          <p className="text-sm text-ink-500">
            {hasFilters ? "No reviews match these filters." : "No reviews yet."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 sm:gap-2.5">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-3 rounded-xl border border-ink-500/10 bg-bg-elevated p-3 shadow-card sm:p-4"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-sm font-semibold text-accent-primary">
                {r.authorName.charAt(0).toUpperCase()}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-[13px] font-medium text-ink-900 sm:text-sm">
                    {r.authorName}
                  </span>
                  {r.verifiedPurchase && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-success">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                  <span className="text-[11px] text-ink-500">· {formatDate(r.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={clsx(
                          "h-3 w-3",
                          i < r.rating
                            ? "fill-accent-gold text-accent-gold"
                            : "fill-transparent text-ink-500/30",
                        )}
                      />
                    ))}
                  </span>
                  {r.productSlug ? (
                    <Link
                      href={`/product/${r.productSlug}`}
                      target="_blank"
                      className="truncate text-[11px] text-accent-primary hover:underline"
                    >
                      {r.productName}
                    </Link>
                  ) : (
                    <span className="truncate text-[11px] text-ink-500">{r.productName}</span>
                  )}
                </div>
                {r.title && (
                  <span className="text-[13px] font-semibold text-ink-900 sm:text-sm">
                    {r.title}
                  </span>
                )}
                <p className="text-[13px] leading-relaxed text-ink-700 sm:text-sm">{r.body}</p>
              </div>
              <button
                type="button"
                aria-label="Delete review"
                onClick={() => setTarget(r)}
                disabled={pendingDelete}
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-500 transition hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={target !== null}
        onClose={() => {
          if (!pendingDelete) setTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Delete this review?"
        description={
          target ? `${target.authorName}'s review will be permanently removed.` : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Keep it"
        tone="danger"
        icon={Trash2}
        pending={pendingDelete}
      />
    </div>
  );
}
