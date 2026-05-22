import { ordersRepo } from "@/lib/db/repos/orders";
import { OrdersListClient } from "@/components/admin/OrdersListClient";

export const metadata = { title: "Orders · Admin" };

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams;
  const allOrders = await ordersRepo.listAll();
  let orders = allOrders;
  if (status) orders = orders.filter((o) => o.status === status);
  if (q) {
    const needle = q.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(needle) ||
        o.shippingAddress.fullName.toLowerCase().includes(needle) ||
        o.shippingAddress.email.toLowerCase().includes(needle),
    );
  }

  return <OrdersListClient orders={orders} totalCount={allOrders.length} />;
}
