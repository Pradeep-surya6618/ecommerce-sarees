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
      {/* ── Hero header ── */}
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-xs">
            <MessageSquareQuote className="h-3 w-3" />
            Moderation
          </span>
          <h1 className="mt-1 font-display text-xl leading-tight text-ink-900 sm:text-2xl md:text-3xl">
            Reviews
          </h1>
          <p className="mt-1 text-[11px] text-ink-700 sm:text-sm">
            {hasFilters
              ? `${filtered.length} of ${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`
              : `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"} · remove spam or abusive entries`}
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
            const count = countFor(pill.value);
            return (
              <button
                key={pill.value || "all"}
                type="button"
                onClick={() => setStars(pill.value)}
                className={clsx(
                  "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition sm:h-8 sm:text-xs",
                  active
                    ? "border-accent-primary bg-accent-primary text-white shadow-[0_6px_18px_-10px_rgba(91,58,138,0.7)]"
                    : "border-ink-500/15 bg-bg-elevated text-ink-700 hover:border-accent-primary hover:text-accent-primary",
                )}
              >
                {pill.label}
                <span
                  className={clsx(
                    "inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] tabular-nums sm:text-[10px]",
                    active ? "bg-white/20 text-white" : "bg-ink-500/8 text-ink-700",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── List / empty state ── */}
      {filtered.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center shadow-card">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
          />
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
            <MessageSquareQuote className="h-5 w-5" />
          </div>
          <p className="text-sm text-ink-500">
            {hasFilters ? "No reviews match these filters." : "No reviews yet."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5 sm:gap-3">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="group relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-3 shadow-card transition hover:border-accent-primary/30 sm:p-4"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
              />
              <div className="flex items-start gap-2.5 sm:gap-3">
                {/* Gradient monogram avatar */}
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary/15 to-accent-gold/15 font-display text-sm font-semibold text-accent-primary sm:h-10 sm:w-10">
                  {r.authorName.charAt(0).toUpperCase()}
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {/* Header line: author + verified + date */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[13px] font-semibold leading-tight text-ink-900 sm:text-sm">
                      {r.authorName}
                    </span>
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-success/12 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-success sm:text-[10px]">
                        <BadgeCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Verified
                      </span>
                    )}
                    <span className="text-[10px] text-ink-500 sm:text-[11px]">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>

                  {/* Stars + product chip */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={clsx(
                            "h-3 w-3 sm:h-3.5 sm:w-3.5",
                            i < r.rating
                              ? "fill-accent-gold text-accent-gold"
                              : "fill-transparent text-ink-500/25",
                          )}
                        />
                      ))}
                    </span>
                    {r.productSlug ? (
                      <Link
                        href={`/product/${r.productSlug}`}
                        target="_blank"
                        className="inline-flex max-w-full items-center rounded-full bg-accent-primary/8 px-2 py-0.5 text-[10px] font-medium text-accent-primary transition hover:bg-accent-primary/15 sm:text-[11px]"
                      >
                        <span className="truncate">{r.productName}</span>
                      </Link>
                    ) : (
                      <span className="truncate text-[10px] text-ink-500 sm:text-[11px]">
                        {r.productName}
                      </span>
                    )}
                  </div>

                  {/* Title + body */}
                  {r.title && (
                    <span className="mt-0.5 font-display text-sm leading-tight text-ink-900 sm:text-base">
                      {r.title}
                    </span>
                  )}
                  <p className="text-[12px] leading-relaxed text-ink-700 sm:text-sm">{r.body}</p>
                </div>

                <button
                  type="button"
                  aria-label="Delete review"
                  onClick={() => setTarget(r)}
                  disabled={pendingDelete}
                  className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-ink-500/15 bg-bg-elevated text-ink-500 transition hover:border-danger hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
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
          target
            ? `${target.authorName}'s ${target.rating}★ review of ${target.productName} will be permanently removed. The product's average rating will be recomputed.`
            : undefined
        }
        confirmLabel="Yes, delete"
        cancelLabel="Keep it"
        tone="danger"
        icon={Trash2}
        pending={pendingDelete}
      />
    </div>
  );
}
