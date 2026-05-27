import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { addressesRepo } from "@/lib/db/repos/addresses";
import { cartRepo } from "@/lib/db/repos/cart";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Checkout · Saree Store",
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  let cart;
  if (user) {
    cart = await cartRepo.getOrCreateForUser(user.id);
  } else {
    const guestSessionId = await getGuestSessionId();
    cart = guestSessionId ? await cartRepo.getOrCreateForGuestSession(guestSessionId) : null;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container size="lg" className="py-12 sm:py-16 md:py-20">
        <EmptyState
          title="Your cart is empty"
          description="Add a saree to begin checkout."
          action={
            <Link
              href="/shop"
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-ink-900 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-ink-700 sm:h-11 sm:px-5 sm:text-xs sm:tracking-[0.2em]"
            >
              Shop sarees
            </Link>
          }
        />
      </Container>
    );
  }

  // Hydrate saved addresses for the address step. Empty for guests.
  const savedAddresses = user ? await addressesRepo.listByUser(user.id) : [];
  const settings = await siteSettingsRepo.get();

  return (
    <CheckoutFlow cart={cart} savedAddresses={savedAddresses} shippingRates={settings.shipping} />
  );
}
