import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getGuestSessionId } from "@/lib/cart/guest-session";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise } from "@/lib/cart/totals";
import { cartRepo } from "@/lib/db/repos/cart";
import { CartLineItem } from "@/components/storefront/CartLineItem";
import { CartSummary } from "@/components/storefront/CartSummary";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
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

  return (
    <Container size="xl" className="py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
      <h1 className="mt-6 font-display text-3xl text-ink-900 md:text-5xl">Your cart</h1>

      {cart.items.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            title="Your cart is empty"
            description="Find your next saree from the shop."
            action={
              <Link
                href="/shop"
                className="mt-2 inline-flex items-center justify-center rounded-sm bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
              >
                Shop sarees
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-12 md:grid-cols-[2fr_1fr]">
          <ul className="flex flex-col divide-y divide-ink-500/10">
            {cart.items.map((item) => (
              <li key={item.id}>
                <CartLineItem item={item} />
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-4 md:sticky md:top-24 md:self-start">
            <CartSummary
              subtotalPaise={subtotalPaise}
              taxPaise={taxPaise}
              totalPaise={totalPaise}
            />
            <Link
              href="/checkout"
              className="rounded-sm bg-accent-primary px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-accent-primary-hover"
            >
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}
