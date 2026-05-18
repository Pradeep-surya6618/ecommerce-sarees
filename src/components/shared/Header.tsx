import Link from "next/link";
import { Heart, Menu, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo } from "@/lib/db/repos/cart";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { CartTrigger } from "@/components/storefront/CartTrigger";
import { SearchPanel } from "@/components/storefront/SearchPanel";
import { Container } from "@/components/ui/Container";
import { IconButton } from "@/components/ui/IconButton";
import type { Cart } from "@/types/domain";

async function readCart(): Promise<Cart> {
  const user = await getCurrentUser();
  if (user) {
    return cartRepo.getOrCreateForUser(user.id);
  }
  const guestSessionId = await getGuestSessionId();
  if (!guestSessionId) {
    return {
      id: "cart_empty",
      userId: null,
      guestSessionId: null,
      items: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return cartRepo.getOrCreateForGuestSession(guestSessionId);
}

export async function Header() {
  const [categories, user, cart] = await Promise.all([
    categoriesRepo.listTopLevel(),
    getCurrentUser(),
    readCart(),
  ]);
  const accountHref = user ? "/account" : "/auth/login";
  const accountLabel = user ? "Account" : "Sign in";

  return (
    <header className="sticky top-0 z-40 border-b border-ink-500/10 bg-bg-base/90 backdrop-blur">
      <Container size="xl">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-3 md:hidden">
            <IconButton aria-label="Open menu" size="sm">
              <Menu className="h-5 w-5" />
            </IconButton>
          </div>

          <Link href="/" className="font-display text-2xl text-ink-900">
            Saree Store
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.slug}
                href={`/shop/${c.slug}`}
                className="text-sm text-ink-700 transition hover:text-ink-900"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/shop"
              className="text-sm font-medium text-accent-primary transition hover:text-accent-primary-hover"
            >
              All Sarees
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <SearchPanel />
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-700 transition hover:bg-ink-900/5 hover:text-ink-900"
            >
              <Heart className="h-5 w-5" />
            </Link>
            <Link
              href={accountHref}
              aria-label={accountLabel}
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-700 transition hover:bg-ink-900/5 hover:text-ink-900"
            >
              <User className="h-5 w-5" />
            </Link>
            <CartTrigger cart={cart} />
          </div>
        </div>
      </Container>
    </header>
  );
}
