import { Star, StarHalf } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface RatingStarsProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeClass: Record<NonNullable<RatingStarsProps["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function RatingStars({ rating, size = "md", showValue, className }: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  const star = sizeClass[size];

  return (
    <div className={clsx("inline-flex items-center gap-1", className)}>
      <span className="inline-flex items-center text-accent-gold">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} className={clsx(star, "fill-current")} />
        ))}
        {hasHalf && <StarHalf className={clsx(star, "fill-current")} />}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} className={clsx(star, "opacity-30")} />
        ))}
      </span>
      {showValue && <span className="text-xs font-medium text-ink-700">{clamped.toFixed(1)}</span>}
    </div>
  );
}
