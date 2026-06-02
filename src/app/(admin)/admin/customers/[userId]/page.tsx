import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AtSign,
  Calendar,
  ChevronRight,
  Mail,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
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

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PROVIDER_LABEL: Record<string, string> = {
  email: "Email + password",
  google: "Google",
};

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const user = await usersRepo.findById(userId);
  if (!user || user.role !== "customer") notFound();
  const orders = await ordersRepo.listByUser(user.id);
  const lifetime = orders.reduce((s, o) => s + o.totalPaise, 0);
  const providerLabel = PROVIDER_LABEL[user.provider] ?? user.provider;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-7">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: user.fullName },
        ]}
      />

      {/* ── Hero header ── */}
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {/* Monogram avatar */}
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-gold/20 font-display text-base font-semibold text-accent-primary sm:h-16 sm:w-16 sm:text-2xl">
              {initialsOf(user.fullName)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-xs">
                <Sparkles className="h-3 w-3" />
                Customer
              </span>
              <h1 className="mt-0.5 truncate font-display text-lg leading-tight text-ink-900 sm:text-xl md:text-2xl">
                {user.fullName}
              </h1>
              <p className="mt-0.5 inline-flex items-center gap-1.5 truncate text-[11px] text-ink-500 sm:text-xs">
                <AtSign className="h-3 w-3 shrink-0" />
                {user.email}
              </p>
            </div>
          </div>
          {user.blocked && (
            <div className="shrink-0">
              <Badge tone="danger">Blocked</Badge>
            </div>
          )}
        </div>
      </header>

      {/* ── Quick metrics ── */}
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          {
            label: "Orders",
            value: String(orders.length),
            icon: ShoppingBag,
            display: true,
          },
          {
            label: "Lifetime",
            value: formatRupees(lifetime),
            icon: Wallet,
            display: true,
          },
          {
            label: "Joined",
            value: formatJoined(user.createdAt),
            icon: Calendar,
            display: false,
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="relative overflow-hidden rounded-xl border border-ink-500/10 bg-bg-elevated p-2.5 shadow-card sm:p-3"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/50 to-transparent"
              />
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-8 sm:w-8">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-500 sm:text-[10px]">
                    {m.label}
                  </dt>
                  <dd
                    className={
                      m.display
                        ? "truncate font-display text-sm tabular-nums text-ink-900 sm:text-lg"
                        : "truncate text-xs font-medium text-ink-900 sm:text-sm"
                    }
                  >
                    {m.value}
                  </dd>
                </div>
              </div>
            </div>
          );
        })}
      </dl>

      {/* ── Body grid ── */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-[2fr_1fr] md:gap-6">
        {/* ── Left column — orders ── */}
        <article className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
          />
          <header className="mb-3 flex items-center gap-2.5 sm:mb-4 sm:gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
              <PackageCheck className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                History
              </span>
              <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
                Orders
              </h2>
            </div>
            <span className="ml-auto inline-flex items-center rounded-full bg-ink-500/8 px-2 py-0.5 text-[10px] font-medium text-ink-700 sm:text-xs">
              {orders.length}
            </span>
          </header>

          {orders.length === 0 ? (
            <p className="text-xs leading-relaxed text-ink-500 sm:text-sm">
              {"No orders yet — they'll appear here when this customer checks out."}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-ink-500/10 bg-bg-base/40 p-3 transition hover:border-accent-primary/40 hover:bg-bg-base sm:p-3.5"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-mono text-[11px] text-ink-700 transition group-hover:text-accent-primary sm:text-xs">
                        {o.id}
                      </span>
                      <span className="text-[10px] text-ink-500 sm:text-[11px]">
                        {formatOrderDate(o.createdAt)} · {o.items.length}{" "}
                        {o.items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <OrderStatusBadge
                      status={o.status}
                      className="px-1.5 py-0 text-[9px] tracking-[0.06em] sm:px-2 sm:py-0.5 sm:text-[10px]"
                    />
                    <span className="shrink-0 font-display text-sm tabular-nums text-ink-900 sm:text-base">
                      {formatRupees(o.totalPaise)}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-500 transition group-hover:translate-x-0.5 group-hover:text-accent-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* ── Right column (sticky on md+) ── */}
        <div className="flex flex-col gap-4 sm:gap-5 md:sticky md:top-24 md:self-start">
          {/* Profile card */}
          <article className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <header className="mb-3 flex items-center gap-2.5 sm:gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
                <User className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                  Profile
                </span>
                <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
                  Details
                </h2>
              </div>
            </header>

            <dl className="flex flex-col gap-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
                <div className="flex min-w-0 flex-col">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-500 sm:text-[10px]">
                    Email
                  </dt>
                  <dd className="truncate text-ink-900">
                    <a
                      href={`mailto:${user.email}`}
                      className="transition hover:text-accent-primary"
                    >
                      {user.email}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
                <div className="flex min-w-0 flex-col">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-500 sm:text-[10px]">
                    Sign-in method
                  </dt>
                  <dd className="text-ink-900">{providerLabel}</dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
                <div className="flex min-w-0 flex-col">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-500 sm:text-[10px]">
                    Joined
                  </dt>
                  <dd className="text-ink-900">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </div>
            </dl>
          </article>

          {/* Actions card */}
          <CustomerBlockButton
            userId={user.id}
            blocked={user.blocked}
            customerName={user.fullName}
          />
        </div>
      </div>
    </div>
  );
}
