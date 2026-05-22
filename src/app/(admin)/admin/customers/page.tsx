import { ordersRepo } from "@/lib/db/repos/orders";
import { usersRepo } from "@/lib/db/repos/users";
import { CustomersListClient, type CustomerRow } from "@/components/admin/CustomersListClient";

export const metadata = { title: "Customers · Admin" };

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const [filteredCustomers, allCustomers, allOrders] = await Promise.all([
    usersRepo.listCustomers({ search: q }),
    usersRepo.listCustomers({}),
    ordersRepo.listAll(),
  ]);

  const rows: CustomerRow[] = filteredCustomers.map((u) => {
    const userOrders = allOrders.filter((o) => o.userId === u.id);
    return {
      ...u,
      orderCount: userOrders.length,
      lifetimePaise: userOrders.reduce((s, o) => s + o.totalPaise, 0),
    };
  });

  return <CustomersListClient rows={rows} totalCount={allCustomers.length} />;
}
