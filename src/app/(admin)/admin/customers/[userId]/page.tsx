import Link from "next/link";
import { notFound } from "next/navigation";
import { ordersRepo } from "@/lib/db/repos/orders";
import { usersRepo } from "@/lib/db/repos/users";
import { formatRupees } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { CustomerBlockButton } from "@/components/admin/CustomerBlockButton";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const user = await usersRepo.findById(userId);
  if (!user || user.role !== "customer") notFound();
  const orders = await ordersRepo.listByUser(user.id);
  const lifetime = orders.reduce((s, o) => s + o.totalPaise, 0);

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: user.fullName },
        ]}
      />
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl text-ink-900">{user.fullName}</h1>
          <p className="text-sm text-ink-500">{user.email}</p>
          {user.blocked && <Badge tone="danger">Blocked</Badge>}
        </div>
        <CustomerBlockButton userId={user.id} blocked={user.blocked} />
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-4">
          <div className="text-xs uppercase tracking-wide text-ink-500">Orders</div>
          <div className="mt-1 font-display text-2xl text-ink-900">{orders.length}</div>
        </div>
        <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-4">
          <div className="text-xs uppercase tracking-wide text-ink-500">Lifetime spend</div>
          <div className="mt-1 font-display text-2xl text-ink-900">{formatRupees(lifetime)}</div>
        </div>
        <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-4">
          <div className="text-xs uppercase tracking-wide text-ink-500">Joined</div>
          <div className="mt-1 font-display text-2xl text-ink-900">
            {new Date(user.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
      </section>
      <section>
        <h2 className="mb-4 font-display text-xl text-ink-900">Orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-ink-500">No orders yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-ink-500/10 rounded-md border border-ink-500/10 bg-bg-elevated">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between p-4">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="font-mono text-ink-900 hover:text-accent-primary"
                >
                  {o.id}
                </Link>
                <OrderStatusBadge status={o.status} />
                <span className="font-semibold tabular-nums text-ink-900">
                  {formatRupees(o.totalPaise)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
