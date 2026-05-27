"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { BadgeCheck, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import { deleteMyReviewAction, submitReviewAction } from "@/server/actions/reviews";
import { ReviewSummary } from "@/components/storefront/ReviewSummary";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Review } from "@/types/domain";

export interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  /** The signed-in customer's own review, if they've written one. */
  myReview: Review | null;
  isSignedIn: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Interactive 1–5 star picker with hover preview.
function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="cursor-pointer p-0.5 transition disabled:cursor-not-allowed"
        >
          <Star
            className={clsx(
              "h-6 w-6 transition",
              n <= shown ? "fill-accent-gold text-accent-gold" : "fill-transparent text-ink-500/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId, reviews, myReview, isSignedIn }: ProductReviewsProps) {
  const [rating, setRating] = useState<number>(myReview?.rating ?? 0);
  const [title, setTitle] = useState(myReview?.title ?? "");
  const [body, setBody] = useState(myReview?.body ?? "");
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please choose a star rating.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await submitReviewAction({
          productId,
          rating,
          title: title.trim() || undefined,
          body,
        });
        if (!result.ok) {
          toast.error("Couldn't save your review", { description: result.error });
          return;
        }
        toast.success(myReview ? "Review updated" : "Thanks for your review!");
      } catch {
        toast.error("Couldn't save your review. Please try again.");
      }
    });
  }

  function onDelete() {
    startDelete(async () => {
      try {
        const result = await deleteMyReviewAction(productId);
        setConfirmOpen(false);
        if (!result.ok) {
          toast.error("Couldn't delete your review", { description: result.error });
          return;
        }
        setRating(0);
        setTitle("");
        setBody("");
        toast.success("Your review was removed");
      } catch {
        setConfirmOpen(false);
        toast.error("Couldn't delete your review. Please try again.");
      }
    });
  }

  return (
    <div className="grid gap-8 md:grid-cols-[280px_minmax(0,1fr)] md:gap-12">
      {/* Left rail: aggregate summary + write/edit form */}
      <div className="flex flex-col gap-6">
        <ReviewSummary reviews={reviews} />

        {isSignedIn ? (
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-3 rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-5"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-gold">
              {myReview ? "Edit your review" : "Write a review"}
            </span>
            <StarPicker value={rating} onChange={setRating} disabled={pending} />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Title (optional)"
              className="autofill-on-light h-10 rounded-full border border-ink-500/20 bg-bg-base px-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="What did you think of this saree?"
              className="rounded-2xl border border-ink-500/20 bg-bg-base px-4 py-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary"
              required
            />
            <div className="flex items-center justify-between gap-2">
              {myReview ? (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={pending || deleting}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-danger/40 px-3 text-xs font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-accent-primary px-5 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Saving…" : myReview ? "Update review" : "Submit review"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 text-sm text-ink-700 sm:p-5">
            <span className="font-medium text-ink-900">Want to share your thoughts?</span>
            <p className="text-xs text-ink-500">Sign in to leave a rating and review.</p>
            <Link
              href="/auth/login"
              className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-full bg-ink-900 text-sm font-medium text-white transition hover:bg-ink-700"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>

      {/* Right: individual reviews */}
      <div className="flex flex-col gap-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-500">
            No reviews yet. {isSignedIn ? "Be the first to write one." : "Sign in to be the first."}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-ink-500/10">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 py-4 first:pt-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-xs font-semibold text-accent-primary">
                    {r.authorName.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
                      {r.authorName}
                      {r.verifiedPurchase && (
                        <span
                          title="Verified purchase"
                          className="inline-flex items-center gap-0.5 text-[10px] font-medium text-success"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-ink-500">{formatDate(r.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={clsx(
                        "h-3.5 w-3.5",
                        i < r.rating
                          ? "fill-accent-gold text-accent-gold"
                          : "fill-transparent text-ink-500/30",
                      )}
                    />
                  ))}
                </div>
                {r.title && <h4 className="text-sm font-semibold text-ink-900">{r.title}</h4>}
                <p className="text-sm leading-relaxed text-ink-700">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (!deleting) setConfirmOpen(false);
        }}
        onConfirm={onDelete}
        title="Remove your review?"
        description="Your rating and review will be deleted from this product."
        confirmLabel="Remove"
        cancelLabel="Keep it"
        tone="danger"
        icon={Trash2}
        pending={deleting}
      />
    </div>
  );
}
