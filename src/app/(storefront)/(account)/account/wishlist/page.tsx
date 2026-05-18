import Link from "next/link";
import { redirect } from "next/navigation";
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
            className="mt-2 inline-flex items-center justify-center rounded-sm bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
          >
            Shop sarees
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink-900">Wishlist</h1>
        <p className="text-sm text-ink-700">{items.length} saved sarees.</p>
      </header>
      <WishlistGrid items={items} />
    </div>
  );
}
