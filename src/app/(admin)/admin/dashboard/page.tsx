import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Clock,
  CreditCard,
  Crown,
  Package,
  ShoppingBag,
  TrendingUp,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { couponsRepo } from "@/lib/db/repos/coupons";
import { ordersRepo } from "@/lib/db/repos/orders";
import { productsRepo } from "@/lib/db/repos/products";
import { usersRepo } from "@/lib/db/repos/users";
import { formatRupees } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { Badge } from "@/components/ui/Badge";
import type { Order, OrderStatus, Product } from "@/types/domain";

export const metadata = { title: "Dashboard · Admin" };

type KpiTone = "violet" | "gold" | "emerald" | "rose";

const KPI_STYLES: Record<KpiTone, { chip: string; orb: string }> = {
  violet: {
    chip: "bg-accent-primary/15 text-accent-primary",
    orb: "from-accent-primary/40 via-accent-primary/10 to-transparent",
  },
  gold: {
    chip: "bg-accent-gold/20 text-accent-gold",
    orb: "from-accent-gold/35 via-accent-gold/10 to-transparent",
  },
  emerald: {
    chip: "bg-success/20 text-success",
    orb: "from-success/35 via-success/10 to-transparent",
  },
  rose: {
    chip: "bg-danger/20 text-danger",
    orb: "from-danger/35 via-danger/10 to-transparent",
  },
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "bg-warning",
  confirmed: "bg-success",
  paid: "bg-accent-gold",
  shipped: "bg-accent-primary",
  delivered: "bg-success/70",
  cancelled: "bg-danger",
  payment_failed: "bg-danger/80",
};

function withinDays(iso: string, days: number, now: number): boolean {
  return now - new Date(iso).getTime() <= days * 86_400_000;
}

function pct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function totalStock(p: Product): number {
  return p.variants.reduce((n, v) => n + v.stock, 0);
}

export default async function AdminDashboardPage() {
  const [allProducts, allOrders, allCustomers, categories, coupons] = await Promise.all([
    productsRepo.list(),
    ordersRepo.listAll(),
    usersRepo.listCustomers({}),
    categoriesRepo.list(),
    couponsRepo.listAll(),
  ]);

  // Use the most recent order/customer createdAt as the "now" anchor so windowed
  // trends stay meaningful even when the fixture data is older than the wallclock.
  // (Avoids Date.now() in render, which the React Compiler treats as impure.)
  const newestTimestamp = [...allOrders, ...allCustomers].reduce((max, item) => {
    const t = new Date(item.createdAt).getTime();
    return t > max ? t : max;
  }, 0);
  const now = newestTimestamp || new Date(0).getTime();

  // Time-windowed buckets — last 30 days vs the 30 before that.
  const last30 = allOrders.filter((o) => withinDays(o.createdAt, 30, now));
  const prev30 = allOrders.filter(
    (o) => !withinDays(o.createdAt, 30, now) && withinDays(o.createdAt, 60, now),
  );

  const revenueLast30 = last30.reduce((sum, o) => sum + o.totalPaise, 0);
  const revenuePrev30 = prev30.reduce((sum, o) => sum + o.totalPaise, 0);
  const revenueTrend = pct(revenueLast30, revenuePrev30);
  const ordersTrend = pct(last30.length, prev30.length);

  const revenueTotal = allOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const nonCancelled = allOrders.filter(
    (o) => o.status !== "cancelled" && o.status !== "payment_failed",
  );
  const aovPaise = nonCancelled.length > 0 ? Math.round(revenueTotal / nonCancelled.length) : 0;

  const customersNew30 = allCustomers.filter((c) => withinDays(c.createdAt, 30, now)).length;

  // Status mix
  const statusCounts = allOrders.reduce<Record<OrderStatus, number>>(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {
      pending_payment: 0,
      confirmed: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      payment_failed: 0,
    },
  );
  const pendingFulfilment = statusCounts.confirmed + statusCounts.paid;

  // Low stock — products with total stock < 5, sorted ascending.
  const lowStock = [...allProducts]
    .map((p) => ({ product: p, stock: totalStock(p) }))
    .filter((x) => x.stock < 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  // Top customers by lifetime spend (from orders).
  const customerSpend = new Map<
    string,
    { name: string; email: string; spend: number; orders: number }
  >();
  for (const o of allOrders) {
    if (!o.userId) continue;
    const cust = allCustomers.find((c) => c.id === o.userId);
    if (!cust) continue;
    const prev = customerSpend.get(o.userId);
    customerSpend.set(o.userId, {
      name: cust.fullName,
      email: cust.email,
      spend: (prev?.spend ?? 0) + o.totalPaise,
      orders: (prev?.orders ?? 0) + 1,
    });
  }
  const topCustomers = [...customerSpend.values()].sort((a, b) => b.spend - a.spend).slice(0, 4);

  const activeCoupons = coupons.filter((c) => c.status === "active").length;

  // ─── Daily revenue (last 14 days from anchor) ───────────────────────
  const dayMs = 86_400_000;
  const trendDays = 14;
  const startOfDay = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const todayStart = startOfDay(now);
  const dailyRevenue: { date: number; revenue: number; orderCount: number }[] = Array.from(
    { length: trendDays },
    (_, i) => ({
      date: todayStart - (trendDays - 1 - i) * dayMs,
      revenue: 0,
      orderCount: 0,
    }),
  );
  const earliestBucket = dailyRevenue[0]!.date;
  for (const o of allOrders) {
    const orderStart = startOfDay(new Date(o.createdAt).getTime());
    if (orderStart < earliestBucket || orderStart > todayStart) continue;
    const idx = Math.round((orderStart - earliestBucket) / dayMs);
    const bucket = dailyRevenue[idx];
    if (bucket) {
      bucket.revenue += o.totalPaise;
      bucket.orderCount += 1;
    }
  }
  const maxDayRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  // ─── Revenue by category ────────────────────────────────────────────
  const categoryRevenue = new Map<string, number>();
  for (const o of allOrders) {
    for (const item of o.items) {
      const product = allProducts.find((p) => p.id === item.productId);
      const slug = product?.categorySlug ?? "uncategorised";
      categoryRevenue.set(slug, (categoryRevenue.get(slug) ?? 0) + item.lineTotalPaise);
    }
  }

  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  const categoryRevenueTotal = [...categoryRevenue.values()].reduce((s, v) => s + v, 0);
  const categorySegments = [...categoryRevenue.entries()]
    .map(([slug, revenue]) => ({ slug, name: categoryName(slug), revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Use distinct palette colors via brand tokens for the first N categories
  const PALETTE = [
    "var(--color-accent-primary)",
    "var(--color-accent-gold)",
    "var(--color-success)",
    "var(--color-danger)",
    "var(--color-warning)",
    "#7a5cb5",
    "#c08d4e",
  ];
  const topCategories = categorySegments.slice(0, 6).map((c, i) => ({
    ...c,
    color: PALETTE[i] ?? "#7a6e8a",
  }));

  // ─── Top selling products by units sold ─────────────────────────────
  const productSales = new Map<string, { quantity: number; revenue: number }>();
  for (const o of allOrders) {
    for (const item of o.items) {
      const prev = productSales.get(item.productId) ?? { quantity: 0, revenue: 0 };
      productSales.set(item.productId, {
        quantity: prev.quantity + item.quantity,
        revenue: prev.revenue + item.lineTotalPaise,
      });
    }
  }
  const topProducts = [...productSales.entries()]
    .map(([id, sales]) => {
      const product = allProducts.find((p) => p.id === id);
      return product ? { product, ...sales } : null;
    })
    .filter((x): x is { product: Product; quantity: number; revenue: number } => x !== null)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  const topProductMaxQuantity = topProducts[0]?.quantity ?? 1;

  // ─── Payment method mix ─────────────────────────────────────────────
  const paymentMix = allOrders.reduce<Record<"razorpay" | "cod", number>>(
    (acc, o) => {
      acc[o.paymentMethod] = (acc[o.paymentMethod] ?? 0) + 1;
      return acc;
    },
    { razorpay: 0, cod: 0 },
  );

  return (
    <div className="flex flex-col gap-5 sm:gap-7">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Dashboard</h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">
          Snapshot of revenue, orders, fulfilment and inventory health.
        </p>
      </header>

      {/* ─── Hero KPIs (dark) ─── */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Revenue"
          value={formatRupees(revenueTotal)}
          icon={Wallet}
          tone="violet"
          subtitle={`${formatRupees(revenueLast30)} last 30 days`}
          trend={revenueTrend}
        />
        <KpiCard
          label="Orders"
          value={allOrders.length.toString()}
          icon={ShoppingBag}
          tone="gold"
          subtitle={`${last30.length} last 30 days`}
          trend={ordersTrend}
        />
        <KpiCard
          label="Customers"
          value={allCustomers.length.toString()}
          icon={UsersRound}
          tone="emerald"
          subtitle={`+${customersNew30} new in 30 days`}
        />
        <KpiCard
          label="Active products"
          value={allProducts.length.toString()}
          icon={Package}
          tone="rose"
          subtitle={`${categories.length} categories`}
        />
      </section>

      {/* ─── At-a-glance insight chips ─── */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        <InsightCard
          icon={Clock}
          tone="violet"
          label="Pending fulfilment"
          value={pendingFulfilment.toString()}
          hint={
            pendingFulfilment > 0 ? "Orders waiting to ship" : "All orders shipped or completed"
          }
          href="/admin/orders?status=confirmed"
        />
        <InsightCard
          icon={AlertTriangle}
          tone={lowStock.length > 0 ? "rose" : "emerald"}
          label="Low stock"
          value={lowStock.length.toString()}
          hint={lowStock.length > 0 ? "Products below 5 units" : "Inventory healthy"}
          href="/admin/products?status=active"
        />
        <InsightCard
          icon={TrendingUp}
          tone="gold"
          label="Avg order value"
          value={formatRupees(aovPaise)}
          hint={`Across ${nonCancelled.length} non-cancelled orders`}
        />
        <InsightCard
          icon={Crown}
          tone="emerald"
          label="Active coupons"
          value={activeCoupons.toString()}
          hint={`${coupons.length - activeCoupons} paused`}
          href="/admin/coupons"
        />
      </section>

      {/* ─── 14-day revenue trend ─── */}
      <RevenueTrendCard
        data={dailyRevenue}
        max={maxDayRevenue}
        totalLast14={dailyRevenue.reduce((s, d) => s + d.revenue, 0)}
      />

      {/* ─── Revenue by category + Top selling products ─── */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <CategoryDonutCard segments={topCategories} total={categoryRevenueTotal} />
        <TopProductsCard items={topProducts} max={topProductMaxQuantity} />
      </section>

      {/* ─── Order status mix + Payment method ─── */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5 md:p-6">
          <header className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <div>
              <h2 className="font-display text-base text-ink-900 sm:text-lg md:text-xl">
                Order status
              </h2>
              <p className="text-[11px] text-ink-500 sm:text-xs">
                {allOrders.length === 0
                  ? "Distribution will populate once orders come in."
                  : `Distribution across all ${allOrders.length} orders.`}
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-accent-primary transition hover:text-accent-primary-hover sm:text-xs"
            >
              All orders
              <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Link>
          </header>

          <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink-500/10">
            {(Object.keys(statusCounts) as OrderStatus[])
              .filter((s) => statusCounts[s] > 0)
              .map((s) => {
                const w = (statusCounts[s] / allOrders.length) * 100;
                return (
                  <span
                    key={s}
                    className={STATUS_COLOR[s]}
                    style={{ width: `${w}%` }}
                    title={`${STATUS_LABEL[s]}: ${statusCounts[s]}`}
                  />
                );
              })}
          </div>

          {allOrders.length === 0 ? (
            <p className="mt-3 text-[11px] italic text-ink-500 sm:mt-4 sm:text-xs">
              No orders yet — status segments will appear here.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 sm:mt-4 sm:gap-x-5">
              {(Object.keys(statusCounts) as OrderStatus[])
                .filter((s) => statusCounts[s] > 0)
                .map((s) => (
                  <li key={s} className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLOR[s]}`} />
                    <span className="text-ink-700">{STATUS_LABEL[s]}</span>
                    <span className="font-mono tabular-nums text-ink-500">{statusCounts[s]}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <PaymentMixCard paymentMix={paymentMix} total={allOrders.length} />
      </section>

      {/* ─── Recent orders + Low stock ─── */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-[1.4fr_1fr]">
        <RecentOrdersCard orders={allOrders} />
        <LowStockCard items={lowStock} />
      </section>

      {/* ─── Top customers ─── */}
      {topCustomers.length > 0 && (
        <section className="rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5 md:p-6">
          <header className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <div>
              <h2 className="font-display text-base text-ink-900 sm:text-lg md:text-xl">
                Top customers
              </h2>
              <p className="text-[11px] text-ink-500 sm:text-xs">Highest lifetime spend.</p>
            </div>
            <Link
              href="/admin/customers"
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-accent-primary transition hover:text-accent-primary-hover sm:text-xs"
            >
              All customers
              <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Link>
          </header>
          <ul className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            {topCustomers.map((c) => (
              <li
                key={c.email}
                className="flex items-center gap-3 rounded-xl border border-ink-500/10 bg-bg-base/60 p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary/15 to-accent-primary/5 text-[11px] font-semibold text-accent-primary sm:h-10 sm:w-10">
                  {initials(c.name)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-[13px] font-medium text-ink-900 sm:text-sm">
                    {c.name}
                  </span>
                  <span className="truncate text-[10px] text-ink-500 sm:text-[11px]">
                    {c.email}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end leading-tight">
                  <span className="font-semibold tabular-nums text-ink-900">
                    {formatRupees(c.spend)}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-ink-500">
                    {c.orders} {c.orders === 1 ? "order" : "orders"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/* ─────────────────────── Sub-components ─────────────────────── */

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: KpiTone;
  subtitle?: string;
  trend?: number | null;
}

function KpiCard({ label, value, icon: Icon, tone, subtitle, trend }: KpiCardProps) {
  const t = KPI_STYLES[tone];
  const trendUp = (trend ?? 0) >= 0;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-ink-900 p-3 text-white shadow-[0_10px_40px_-20px_rgba(37,31,62,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_60px_-20px_rgba(37,31,62,0.7)] sm:p-5">
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br ${t.orb} opacity-90 blur-2xl`}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent"
      />
      <div className="relative flex items-center justify-between gap-1.5">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${t.chip} sm:h-10 sm:w-10 sm:rounded-xl`}
        >
          <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </span>
        {trend !== undefined && trend !== null && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
              trendUp ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
            } sm:px-2 sm:text-[11px]`}
          >
            {trendUp ? (
              <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            ) : (
              <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div
        className="relative mt-2 truncate font-display text-lg text-white sm:mt-4 sm:text-3xl md:text-[2rem]"
        title={value}
      >
        {value}
      </div>
      <div className="relative mt-0.5 text-[8px] font-medium uppercase tracking-[0.18em] text-white/55 sm:text-[10px] sm:tracking-[0.2em]">
        {label}
      </div>
      {subtitle && (
        <div
          className="relative mt-1.5 truncate text-[10px] text-white/70 sm:mt-2 sm:text-xs"
          title={subtitle}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

interface InsightCardProps {
  icon: LucideIcon;
  tone: KpiTone;
  label: string;
  value: string;
  hint: string;
  href?: string;
}

function InsightCard({ icon: Icon, tone, label, value, hint, href }: InsightCardProps) {
  const t = KPI_STYLES[tone];
  const body = (
    <div className="group relative flex items-center gap-2.5 rounded-2xl border border-ink-500/10 bg-bg-elevated p-2.5 shadow-card transition hover:-translate-y-0.5 hover:border-ink-500/20 hover:shadow-elev sm:gap-3 sm:p-4">
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.chip} sm:h-11 sm:w-11 sm:rounded-xl`}
      >
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-[8px] font-medium uppercase tracking-[0.16em] text-ink-500 sm:text-[10px] sm:tracking-[0.18em]">
          {label}
        </span>
        <span className="truncate font-display text-base text-ink-900 sm:text-xl" title={value}>
          {value}
        </span>
        <span className="truncate text-[9px] text-ink-500 sm:text-[11px]">{hint}</span>
      </div>
      {href && (
        <ArrowUpRight className="h-3 w-3 shrink-0 text-ink-500 transition group-hover:text-accent-primary sm:h-3.5 sm:w-3.5" />
      )}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function RecentOrdersCard({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated shadow-card">
      <div className="flex items-center justify-between border-b border-ink-500/10 px-4 py-3 sm:px-5 sm:py-4">
        <div>
          <h2 className="font-display text-base text-ink-900 sm:text-lg md:text-xl">
            Recent orders
          </h2>
          <p className="text-[11px] text-ink-500 sm:text-xs">Latest 5.</p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-accent-primary transition hover:text-accent-primary-hover sm:text-xs"
        >
          View all
          <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-base">
            <ShoppingBag className="h-5 w-5 text-ink-500" />
          </span>
          <p className="text-sm text-ink-500">No orders yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-ink-500/10">
          {orders.slice(0, 5).map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-bg-base/40 sm:px-5 sm:py-3.5"
              >
                <div className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate font-mono text-[11px] text-ink-900 sm:text-xs">
                    {o.id}
                  </span>
                  <span className="truncate text-[10px] text-ink-500 sm:text-[11px]">
                    {o.shippingAddress.fullName} ·{" "}
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <OrderStatusBadge status={o.status} />
                  <span className="font-semibold tabular-nums text-ink-900 sm:text-[15px]">
                    {formatRupees(o.totalPaise)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LowStockCard({ items }: { items: { product: Product; stock: number }[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated shadow-card">
      <div className="flex items-center justify-between border-b border-ink-500/10 px-4 py-3 sm:px-5 sm:py-4">
        <div>
          <h2 className="font-display text-base text-ink-900 sm:text-lg md:text-xl">Low stock</h2>
          <p className="text-[11px] text-ink-500 sm:text-xs">Under 5 units.</p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-accent-primary transition hover:text-accent-primary-hover sm:text-xs"
        >
          Inventory
          <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
            <Package className="h-5 w-5 text-success" />
          </span>
          <p className="text-sm text-ink-500">Inventory is healthy.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-ink-500/10">
          {items.map(({ product, stock }) => (
            <li key={product.id}>
              <Link
                href={`/admin/products/${product.id}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-bg-base/40 sm:px-5 sm:py-3.5"
              >
                <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-ink-500/5">
                  {product.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0].url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-[13px] font-medium text-ink-900 sm:text-sm">
                    {product.name}
                  </span>
                  <span className="truncate text-[10px] text-ink-500 sm:text-[11px]">
                    {product.categorySlug}
                  </span>
                </div>
                <Badge
                  tone={stock === 0 ? "danger" : "warning"}
                  className="!px-1.5 !py-0.5 !text-[9px] !tracking-wider sm:!px-2 sm:!text-[10px]"
                >
                  {stock} {stock === 1 ? "unit" : "units"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Revenue trend (14-day bar chart) ─── */

function RevenueTrendCard({
  data,
  max,
  totalLast14,
}: {
  data: { date: number; revenue: number; orderCount: number }[];
  max: number;
  totalLast14: number;
}) {
  return (
    <section className="rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5 md:p-6">
      <header className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="font-display text-base text-ink-900 sm:text-lg md:text-xl">
            Revenue trend
          </h2>
          <p className="text-[11px] text-ink-500 sm:text-xs">
            Last 14 days · {formatRupees(totalLast14)} total
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-primary/10 px-2.5 py-1 text-[10px] font-medium text-accent-primary sm:text-[11px]">
          <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Daily
        </span>
      </header>

      <div className="flex h-32 items-end gap-1 sm:h-40 sm:gap-1.5">
        {data.map((d) => {
          const h = Math.max((d.revenue / max) * 100, d.revenue > 0 ? 4 : 0);
          const isEmpty = d.revenue === 0;
          return (
            <div key={d.date} className="group relative flex flex-1 flex-col items-center">
              <div
                className={`w-full rounded-t-md transition ${
                  isEmpty
                    ? "bg-ink-500/10"
                    : "bg-gradient-to-t from-accent-primary to-accent-primary-hover group-hover:from-accent-primary-hover group-hover:to-accent-primary"
                }`}
                style={{ height: `${h}%` }}
              />
              {!isEmpty && (
                <div
                  className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block"
                  role="tooltip"
                >
                  {formatRupees(d.revenue)} · {d.orderCount}{" "}
                  {d.orderCount === 1 ? "order" : "orders"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ul className="mt-2 flex gap-1 sm:gap-1.5">
        {data.map((d, i) => {
          const date = new Date(d.date);
          // Show day label every 2-3 bars to avoid crowding on mobile.
          const showLabel = i % 3 === 0 || i === data.length - 1;
          return (
            <li
              key={d.date}
              className="flex flex-1 justify-center text-center text-[9px] font-medium text-ink-500 sm:text-[10px]"
            >
              {showLabel
                ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : ""}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─── Category donut chart ─── */

interface DonutSegment {
  slug: string;
  name: string;
  revenue: number;
  color: string;
}

interface DonutSegmentWithGeometry extends DonutSegment {
  len: number;
  dashoffset: number;
}

// Extracted out of render so the cumulative-offset accumulator doesn't trip
// the React Compiler's "don't reassign after render" rule.
function buildDonutGeometry(
  segments: DonutSegment[],
  total: number,
  C: number,
): DonutSegmentWithGeometry[] {
  const result: DonutSegmentWithGeometry[] = [];
  let cumulative = 0;
  for (const s of segments) {
    const len = (s.revenue / total) * C;
    result.push({ ...s, len, dashoffset: -cumulative });
    cumulative += len;
  }
  return result;
}

function CategoryDonutCard({ segments, total }: { segments: DonutSegment[]; total: number }) {
  const isEmpty = segments.length === 0 || total === 0;
  const C = 2 * Math.PI * 40;
  const ringSegments = isEmpty ? [] : buildDonutGeometry(segments, total, C);

  return (
    <section className="rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5 md:p-6">
      <header className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
        <div>
          <h2 className="font-display text-base text-ink-900 sm:text-lg md:text-xl">
            Revenue by category
          </h2>
          <p className="text-[11px] text-ink-500 sm:text-xs">
            {isEmpty
              ? "Categories will rank by share of total spend once orders come in."
              : `Share of total spend across ${segments.length} ${segments.length === 1 ? "category" : "categories"}.`}
          </p>
        </div>
      </header>

      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative shrink-0">
          <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90 sm:h-32 sm:w-32">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="14" />
            {ringSegments.map((s) => (
              <circle
                key={s.slug}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={s.color}
                strokeWidth="14"
                strokeDasharray={`${s.len} ${C - s.len}`}
                strokeDashoffset={s.dashoffset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[8px] font-medium uppercase tracking-wider text-ink-500">
              Total
            </span>
            <span className="font-display text-sm text-ink-900 sm:text-base">
              {formatRupees(total)}
            </span>
          </div>
        </div>

        {isEmpty ? (
          <p className="flex-1 text-[11px] italic text-ink-500 sm:text-xs">No revenue yet.</p>
        ) : (
          <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
            {ringSegments.map((s) => {
              const share = Math.round((s.revenue / total) * 100);
              return (
                <li key={s.slug} className="flex items-center gap-2 text-[11px] sm:text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-ink-900">{s.name}</span>
                  <span className="font-mono tabular-nums text-ink-500">{share}%</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ─── Top selling products ─── */

function TopProductsCard({
  items,
  max,
}: {
  items: { product: Product; quantity: number; revenue: number }[];
  max: number;
}) {
  return (
    <section className="rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5 md:p-6">
      <header className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
        <div>
          <h2 className="font-display text-base text-ink-900 sm:text-lg md:text-xl">Top selling</h2>
          <p className="text-[11px] text-ink-500 sm:text-xs">Best-selling products by units.</p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-accent-primary transition hover:text-accent-primary-hover sm:text-xs"
        >
          All products
          <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-500/10 text-ink-500">
            <Package className="h-5 w-5" />
          </span>
          <p className="text-[11px] italic text-ink-500 sm:text-xs">
            Products will rank by units sold once orders come in.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 sm:gap-2.5">
          {items.map(({ product, quantity, revenue }) => {
            const w = (quantity / max) * 100;
            return (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-2.5 rounded-xl border border-ink-500/10 bg-bg-base/60 p-2 transition hover:border-ink-500/20 hover:bg-bg-base sm:gap-3 sm:p-2.5"
                >
                  <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md bg-ink-500/5 sm:h-12 sm:w-10">
                    {product.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 leading-tight">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="truncate text-[12px] font-medium text-ink-900 sm:text-sm">
                        {product.name}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-500 sm:text-[11px]">
                        {quantity} sold
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-500/10">
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-primary-hover"
                          style={{ width: `${w}%` }}
                        />
                      </div>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-900 sm:text-[11px]">
                        {formatRupees(revenue)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ─── Payment mix donut ─── */

function PaymentMixCard({
  paymentMix,
  total,
}: {
  paymentMix: Record<"razorpay" | "cod", number>;
  total: number;
}) {
  const isEmpty = total === 0;
  const C = 2 * Math.PI * 40;
  const safeTotal = isEmpty ? 1 : total;
  const razorpayLen = (paymentMix.razorpay / safeTotal) * C;
  const codLen = (paymentMix.cod / safeTotal) * C;

  return (
    <div className="rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5 md:p-6">
      <header className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
        <div>
          <h2 className="font-display text-base text-ink-900 sm:text-lg md:text-xl">
            Payment method
          </h2>
          <p className="text-[11px] text-ink-500 sm:text-xs">Razorpay vs Cash on delivery.</p>
        </div>
      </header>

      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative shrink-0">
          <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90 sm:h-28 sm:w-28">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="14" />
            {paymentMix.razorpay > 0 && (
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="var(--color-accent-primary)"
                strokeWidth="14"
                strokeDasharray={`${razorpayLen} ${C - razorpayLen}`}
                strokeDashoffset={0}
              />
            )}
            {paymentMix.cod > 0 && (
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="var(--color-accent-gold)"
                strokeWidth="14"
                strokeDasharray={`${codLen} ${C - codLen}`}
                strokeDashoffset={-razorpayLen}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-sm text-ink-900 sm:text-base">{total}</span>
            <span className="text-[9px] font-medium uppercase tracking-wider text-ink-500">
              Orders
            </span>
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col gap-2">
          <li className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
              <CreditCard className="h-3.5 w-3.5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
                Razorpay
              </span>
              <span className="font-mono text-sm text-ink-900">
                {paymentMix.razorpay}{" "}
                <span className="text-[10px] text-ink-500">
                  ({Math.round((paymentMix.razorpay / safeTotal) * 100)}%)
                </span>
              </span>
            </div>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-gold/15 text-accent-gold">
              <Banknote className="h-3.5 w-3.5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
                Cash on delivery
              </span>
              <span className="font-mono text-sm text-ink-900">
                {paymentMix.cod}{" "}
                <span className="text-[10px] text-ink-500">
                  ({Math.round((paymentMix.cod / safeTotal) * 100)}%)
                </span>
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
