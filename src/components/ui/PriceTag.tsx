import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";

export interface PriceTagProps {
  priceInPaise: number;
  mrpInPaise?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass: Record<NonNullable<PriceTagProps["size"]>, { price: string; rest: string }> = {
  sm: { price: "text-base font-semibold", rest: "text-xs" },
  md: { price: "text-lg font-semibold", rest: "text-sm" },
  lg: { price: "text-2xl font-semibold", rest: "text-base" },
};

export function PriceTag({ priceInPaise, mrpInPaise, size = "md", className }: PriceTagProps) {
  const showStrike = typeof mrpInPaise === "number" && mrpInPaise > priceInPaise;
  const classes = sizeClass[size];

  return (
    <div className={clsx("flex flex-wrap items-baseline gap-2 tabular-nums", className)}>
      <span className={clsx("text-ink-900", classes.price)}>{formatRupees(priceInPaise)}</span>
      {showStrike && (
        <span className={clsx("text-ink-500 line-through", classes.rest)}>
          {formatRupees(mrpInPaise)}
        </span>
      )}
    </div>
  );
}
