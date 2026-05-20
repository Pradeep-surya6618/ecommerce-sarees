import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { wishlistRepo } from "@/lib/db/repos/wishlist";
import { WishlistGrid } from "@/components/account/WishlistGrid";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Wishlist · Saree Store" };

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account/wishlist");
  const items = await wishlistRepo.listByUser(user.id);

  if (items.length === 0) {
    return (
      <EmptyState
        title="No saved sarees yet"
        description="Tap the heart on any product to save it for later."
        action={
          <Link
            href="/shop"
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-ink-900 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-ink-700 sm:h-11 sm:px-5 sm:text-xs sm:tracking-[0.2em]"
          >
            Shop sarees
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      <header className="flex min-w-0 flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-accent-gold sm:text-xs">
          <Sparkles className="h-3 w-3" />
          Your space
        </span>
        <h1 className="font-display text-lg leading-tight text-ink-900 sm:text-2xl md:text-3xl">
          Wishlist
        </h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">
          {items.length} saved {items.length === 1 ? "saree" : "sarees"}.
        </p>
      </header>
      <WishlistGrid items={items} />
    </div>
  );
}
