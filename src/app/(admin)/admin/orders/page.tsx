import Link from "next/link";
import { ordersRepo } from "@/lib/db/repos/orders";
import { formatRupees } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import type { Order } from "@/types/domain";

export const metadata = { title: "Orders · Admin" };

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams;
  let orders = await ordersRepo.listAll();
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

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl text-ink-900">Orders</h1>
        <p className="text-sm text-ink-700">{orders.length} orders.</p>
      </header>
      <AdminFilterBar
        statusOptions={STATUS_OPTIONS}
        placeholder="Search by order id, name, or email"
      />
      <AdminTable<Order>
        columns={[
          {
            key: "id",
            header: "Order",
            cell: (o) => (
              <Link
                href={`/admin/orders/${o.id}`}
                className="font-mono text-ink-900 hover:text-accent-primary"
              >
                {o.id}
              </Link>
            ),
          },
          { key: "name", header: "Customer", cell: (o) => o.shippingAddress.fullName },
          { key: "items", header: "Items", align: "right", cell: (o) => o.items.length },
          {
            key: "total",
            header: "Total",
            align: "right",
            cell: (o) => formatRupees(o.totalPaise),
          },
          { key: "status", header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
          {
            key: "placed",
            header: "Placed",
            cell: (o) =>
              new Date(o.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
          },
        ]}
        rows={orders}
        getRowKey={(o) => o.id}
        emptyState={<p className="text-sm text-ink-500">No orders match these filters.</p>}
      />
    </div>
  );
}
