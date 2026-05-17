import { RatingStars } from "@/components/ui/RatingStars";
import type { Review } from "@/types/domain";

export interface ReviewSummaryProps {
  reviews: Review[];
}

export function ReviewSummary({ reviews }: ReviewSummaryProps) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col gap-1 text-sm text-ink-500">
        <RatingStars rating={0} />
        <span>No reviews yet</span>
      </div>
    );
  }

  const total = reviews.length;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) distribution[r.rating]! += 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <span className="font-display text-4xl text-ink-900">{avg.toFixed(1)}</span>
        <div className="flex flex-col gap-1">
          <RatingStars rating={avg} size="md" />
          <span className="text-xs text-ink-500">
            {total} {total === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <li key={star} className="flex items-center gap-3 text-xs text-ink-700">
              <span className="w-3 text-right">{star}</span>
              <div className="relative h-1.5 flex-1 rounded-full bg-ink-500/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-accent-gold"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right tabular-nums text-ink-500">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
