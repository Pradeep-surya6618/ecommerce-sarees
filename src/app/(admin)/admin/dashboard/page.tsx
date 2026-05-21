import Link from "next/link";
import { ArrowUpRight, Package, ShoppingBag, UsersRound, Wallet } from "lucide-react";
import { ordersRepo } from "@/lib/db/repos/orders";
import { productsRepo } from "@/lib/db/repos/products";
import { formatRupees } from "@/lib/money";

export const metadata = { title: "Dashboard · Admin" };

type TileTone = "violet" | "amber" | "emerald" | "rose";

const TONE_STYLES: Record<TileTone, { chip: string; ring: string }> = {
  violet: {
    chip: "bg-accent-primary/10 text-accent-primary",
    ring: "from-accent-primary/15 to-transparent",
  },
  amber: {
    chip: "bg-accent-gold/15 text-accent-gold",
    ring: "from-accent-gold/15 to-transparent",
  },
  emerald: {
    chip: "bg-success/10 text-success",
    ring: "from-success/15 to-transparent",
  },
  rose: {
    chip: "bg-danger/10 text-danger",
    ring: "from-danger/15 to-transparent",
  },
};

export default async function AdminDashboardPage() {
  const [allProducts, allOrders] = await Promise.all([productsRepo.list(), ordersRepo.listAll()]);

  const revenuePaise = allOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const uniqueCustomers = new Set(allOrders.map((o) => o.userId ?? o.guestSessionId)).size;

  const tiles: { label: string; value: string; icon: typeof Package; tone: TileTone }[] = [
    {
      label: "Active products",
      value: allProducts.length.toString(),
      icon: Package,
      tone: "violet",
    },
    {
      label: "Total orders",
      value: allOrders.length.toString(),
      icon: ShoppingBag,
      tone: "amber",
    },
    {
      label: "Total revenue",
      value: formatRupees(revenuePaise),
      icon: Wallet,
      tone: "emerald",
    },
    {
      label: "Unique customers",
      value: uniqueCustomers.toString(),
      icon: UsersRound,
      tone: "rose",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Dashboard</h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">Quick overview of the store.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          const tone = TONE_STYLES[t.tone];
          return (
            <div
              key={t.label}
              className="group relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elev"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${tone.ring}`}
              />
              <div className="relative flex items-center justify-between">
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tone.chip}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
              </div>
              <div className="relative mt-4 font-display text-3xl text-ink-900">{t.value}</div>
              <div className="relative mt-1 text-xs uppercase tracking-wider text-ink-500">
                {t.label}
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-ink-500/10 bg-bg-elevated shadow-card">
        <div className="flex items-center justify-between border-b border-ink-500/10 px-5 py-4">
          <h2 className="font-display text-lg text-ink-900">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-primary transition hover:text-accent-primary-hover"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {allOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-base">
              <ShoppingBag className="h-5 w-5 text-ink-500" />
            </span>
            <p className="text-sm text-ink-500">No orders yet.</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-ink-500/10">
            {allOrders.slice(0, 5).map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between px-5 py-3.5 transition hover:bg-bg-base/40"
              >
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
