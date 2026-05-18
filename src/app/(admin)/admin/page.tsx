import { Package, ShoppingBag, UsersRound, Wallet } from "lucide-react";
import { ordersRepo } from "@/lib/db/repos/orders";
import { productsRepo } from "@/lib/db/repos/products";
import { formatRupees } from "@/lib/money";

export const metadata = { title: "Dashboard · Admin" };

export default async function AdminDashboardPage() {
  const [allProducts, allOrders] = await Promise.all([productsRepo.list(), ordersRepo.listAll()]);

  const revenuePaise = allOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const uniqueCustomers = new Set(allOrders.map((o) => o.userId ?? o.guestSessionId)).size;

  const tiles = [
    { label: "Active products", value: allProducts.length.toString(), icon: Package },
    { label: "Total orders", value: allOrders.length.toString(), icon: ShoppingBag },
    { label: "Total revenue", value: formatRupees(revenuePaise), icon: Wallet },
    { label: "Unique customers", value: uniqueCustomers.toString(), icon: UsersRound },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-700">Quick overview of the store.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="rounded-md border border-ink-500/10 bg-bg-elevated p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500">
                <Icon className="h-4 w-4" /> {t.label}
              </div>
              <div className="mt-2 font-display text-2xl text-ink-900">{t.value}</div>
            </div>
          );
        })}
      </section>
      <section>
        <h2 className="mb-4 font-display text-xl text-ink-900">Recent orders</h2>
        {allOrders.length === 0 ? (
          <p className="text-sm text-ink-500">No orders yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-ink-500/10 rounded-md border border-ink-500/10 bg-bg-elevated">
            {allOrders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="font-mono text-sm text-ink-900">{o.id}</span>
                  <span className="text-xs text-ink-500">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {o.items.length} items
                  </span>
                </div>
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
