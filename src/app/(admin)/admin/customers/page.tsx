import Link from "next/link";
import { ordersRepo } from "@/lib/db/repos/orders";
import { usersRepo } from "@/lib/db/repos/users";
import { formatRupees } from "@/lib/money";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import type { User } from "@/types/domain";

export const metadata = { title: "Customers · Admin" };

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const customers = await usersRepo.listCustomers({ search: q });
  const allOrders = await ordersRepo.listAll();

  type Row = User & { orderCount: number; lifetimePaise: number };
  const rows: Row[] = customers.map((u) => {
    const userOrders = allOrders.filter((o) => o.userId === u.id);
    return {
      ...u,
      orderCount: userOrders.length,
      lifetimePaise: userOrders.reduce((s, o) => s + o.totalPaise, 0),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl text-ink-900">Customers</h1>
        <p className="text-sm text-ink-700">{rows.length} customers.</p>
      </header>
      <AdminFilterBar placeholder="Search by email or name" />
      <AdminTable<Row>
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (r) => (
              <Link
                href={`/admin/customers/${r.id}`}
                className="font-medium text-ink-900 hover:text-accent-primary"
              >
                {r.fullName}
              </Link>
            ),
          },
          { key: "email", header: "Email", cell: (r) => r.email },
          { key: "orders", header: "Orders", align: "right", cell: (r) => r.orderCount },
          {
            key: "spend",
            header: "Lifetime spend",
            align: "right",
            cell: (r) => formatRupees(r.lifetimePaise),
          },
          {
            key: "status",
            header: "",
            cell: (r) => (r.blocked ? <Badge tone="danger">Blocked</Badge> : null),
          },
        ]}
        rows={rows}
        getRowKey={(r) => r.id}
      />
    </div>
  );
}
