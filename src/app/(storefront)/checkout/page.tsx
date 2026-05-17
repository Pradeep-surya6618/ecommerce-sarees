import Link from "next/link";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { cartRepo } from "@/lib/db/repos/cart";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Checkout · Saree Store",
};

export default async function CheckoutPage() {
  const guestSessionId = await getGuestSessionId();
  const cart = guestSessionId ? await cartRepo.getOrCreateForGuestSession(guestSessionId) : null;

  if (!cart || cart.items.length === 0) {
    return (
      <Container size="lg" className="py-20">
        <EmptyState
          title="Your cart is empty"
          description="Add a saree to begin checkout."
          action={
            <Link
              href="/shop"
              className="mt-2 inline-flex items-center justify-center rounded-sm bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
            >
              Shop sarees
            </Link>
          }
        />
      </Container>
    );
  }

  return <CheckoutFlow cart={cart} />;
}
