import Link from "next/link";
import { ShoppingBag, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise } from "@/lib/cart/totals";
import { cartRepo } from "@/lib/db/repos/cart";
import { CartLineItem } from "@/components/storefront/CartLineItem";
import { CartSummary } from "@/components/storefront/CartSummary";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Cart · Saree Store",
};

export default async function CartPage() {
  const user = await getCurrentUser();
  const cart = user
    ? await cartRepo.getOrCreateForUser(user.id)
    : await (async () => {
        const guestSessionId = await getGuestSessionId();
        return guestSessionId
          ? cartRepo.getOrCreateForGuestSession(guestSessionId)
          : { id: "cart_empty", userId: null, guestSessionId: null, items: [], updatedAt: "" };
      })();
  const subtotalPaise = computeSubtotalPaise(cart.items);
  const taxPaise = computeTaxPaise(subtotalPaise);
  const totalPaise = computeTotalPaise({ subtotalPaise, taxPaise, shippingPaise: 0 });
  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Container size="xl" className="px-4! py-5 sm:px-6! sm:py-8 md:px-8! md:py-10">
      {/* ── Header ── */}
      <header className="flex min-w-0 flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-accent-gold sm:text-xs">
          <Sparkles className="h-3 w-3" />
          Almost yours
        </span>
        <h1 className="font-display text-lg leading-tight text-ink-900 sm:text-2xl md:text-3xl">
          Your cart
        </h1>
        {cart.items.length > 0 && (
          <p className="text-[11px] text-ink-700 sm:text-sm">
            {itemCount} {itemCount === 1 ? "saree" : "sarees"} in your cart.
          </p>
        )}
      </header>

      {cart.items.length === 0 ? (
        <div className="mt-6 sm:mt-10">
          <EmptyState
            title="Your cart is empty"
            description="Find your next saree from the shop."
            action={
              <Link
                href="/shop"
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-ink-900 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-ink-700 sm:h-11 sm:px-5 sm:text-xs sm:tracking-[0.2em]"
              >
                Shop sarees
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 md:mt-10 md:grid-cols-[2fr_1fr] md:gap-10">
          {/* ── Line items card ── */}
          <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-3 sm:p-5 md:p-6">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <ul className="flex flex-col divide-y divide-ink-500/10">
              {cart.items.map((item) => (
                <li key={item.id}>
                  <CartLineItem item={item} />
                </li>
              ))}
            </ul>
          </section>

          {/* ── Summary + CTA (sticky on desktop) ── */}
          <div className="flex flex-col gap-3 sm:gap-4 md:sticky md:top-24 md:self-start">
            <CartSummary
              subtotalPaise={subtotalPaise}
              taxPaise={taxPaise}
              totalPaise={totalPaise}
            />
            <Link
              href="/checkout"
              className="group relative inline-flex h-11 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-accent-primary px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-accent-primary-hover sm:h-12 sm:text-sm"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1.5 bg-accent-gold transition-all group-hover:w-2"
              />
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}
