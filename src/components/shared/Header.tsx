import Link from "next/link";
import { User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo } from "@/lib/db/repos/cart";
import { wishlistRepo } from "@/lib/db/repos/wishlist";
import { loadMegaMenu } from "@/lib/nav/mega-menu";
import { MegaMenu } from "@/components/shared/MegaMenu";
import { MobileNavDrawer } from "@/components/shared/MobileNavDrawer";
import { NavTooltip } from "@/components/shared/NavTooltip";
import { CartTrigger } from "@/components/storefront/CartTrigger";
import { SearchPanel } from "@/components/storefront/SearchPanel";
import { WishlistTrigger } from "@/components/storefront/WishlistTrigger";
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

const iconBtn =
  "group relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-900/[0.06] hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary";

function BrandWordmark({ centered = false }: { centered?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Saree Store · Home"
      className={`inline-flex flex-col justify-center ${centered ? "items-center" : "items-start"}`}
    >
      <span className="whitespace-nowrap font-display text-lg leading-none tracking-wide text-ink-900 sm:text-xl md:text-[26px]">
        Saree Store
      </span>
      <span
        aria-hidden
        className={`mt-1.5 h-px w-10 bg-gradient-to-r ${
          centered
            ? "from-transparent via-accent-gold to-transparent"
            : "from-accent-gold to-transparent"
        }`}
      />
    </Link>
  );
}

export async function Header() {
  const [menuItems, user, cart] = await Promise.all([loadMegaMenu(), getCurrentUser(), readCart()]);
  const wishlistCount = user ? (await wishlistRepo.listByUser(user.id)).length : 0;
  const accountHref = user ? "/account" : "/auth/login";
  const accountLabel = user ? "Account" : "Sign in";

  return (
    <header className="sticky top-0 z-40 border-b border-ink-500/10 bg-bg-base/85 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-12">
        <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-2 md:h-20 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          {/* LEFT */}
          <div className="flex items-center justify-start">
            <div className="md:hidden">
              <MobileNavDrawer items={menuItems} user={user} />
            </div>
            <div className="hidden md:block">
              <BrandWordmark />
            </div>
          </div>

          {/* CENTER */}
          <div className="flex items-center justify-center">
            <div className="md:hidden">
              <BrandWordmark centered />
            </div>
            <div className="hidden md:block">
              <MegaMenu items={menuItems} />
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center justify-end gap-0.5 md:gap-1.5">
            <SearchPanel />
            <div className="hidden md:block">
              <WishlistTrigger count={wishlistCount} />
            </div>
            <Link
              href={accountHref}
              aria-label={accountLabel}
              className={`${iconBtn} hidden md:inline-flex`}
            >
              <User className="h-[18px] w-[18px]" />
              <NavTooltip label={accountLabel} />
            </Link>
            <CartTrigger cart={cart} />
          </div>
        </div>
      </div>

      {/* Hairline accent stripe */}
      <span
        aria-hidden
        className="block h-px w-full bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent"
      />
    </header>
  );
}
