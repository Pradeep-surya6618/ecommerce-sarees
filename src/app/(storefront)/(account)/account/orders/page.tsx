import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ordersRepo } from "@/lib/db/repos/orders";
import { OrderCard } from "@/components/account/OrderCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Orders · Saree Store" };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account/orders");
  const orders = await ordersRepo.listByUser(user.id);

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Find a saree you love and we'll keep your orders here."
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
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink-900">Your orders</h1>
        <p className="text-sm text-ink-700">
          {orders.length} {orders.length === 1 ? "order" : "orders"} placed.
        </p>
      </header>
      <ul className="flex flex-col gap-4">
        {orders.map((o) => (
          <li key={o.id}>
            <OrderCard order={o} />
          </li>
        ))}
      </ul>
    </div>
  );
}
