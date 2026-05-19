import Link from "next/link";
import { HeartIcon } from "@/components/shared/icons";
import { NavTooltip } from "@/components/shared/NavTooltip";

export interface WishlistTriggerProps {
  count: number;
}

export function WishlistTrigger({ count }: WishlistTriggerProps) {
  return (
    <Link
      href="/account/wishlist"
      aria-label={`Wishlist${count > 0 ? `, ${count} items` : ""}`}
      className="group relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-900/[0.06] hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
    >
      <HeartIcon className="h-[20px] w-[20px]" />
      {count > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-0.5 top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-semibold leading-none tabular-nums text-white ring-2 ring-bg-base"
        >
          {count}
        </span>
      )}
      <NavTooltip label="Wishlist" />
    </Link>
  );
}
