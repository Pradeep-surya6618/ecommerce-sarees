import { EmptyState } from "@/components/ui/EmptyState";
import { RatingStars } from "@/components/ui/RatingStars";
import type { Review } from "@/types/domain";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="Be the first to review"
        description="Once you've worn it, share what you think."
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-ink-500/10">
      {reviews.map((r) => {
        const dateText = new Date(r.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return (
          <li key={r.id} className="flex flex-col gap-2 py-6">
            <div className="flex items-center gap-3">
              <RatingStars rating={r.rating} size="sm" />
              {r.verifiedPurchase && (
                <span className="text-xs uppercase tracking-wide text-success">Verified buyer</span>
              )}
            </div>
            {r.title && <h3 className="font-display text-lg text-ink-900">{r.title}</h3>}
            <p className="text-sm text-ink-700">{r.body}</p>
            <span className="text-xs text-ink-500">
              {r.authorName} · {dateText}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
