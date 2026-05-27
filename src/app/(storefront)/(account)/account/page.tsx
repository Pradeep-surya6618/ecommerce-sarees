import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CalendarCheck, Heart, MapPin, Package, Sparkles, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { addressesRepo } from "@/lib/db/repos/addresses";
import { ordersRepo } from "@/lib/db/repos/orders";
import { wishlistRepo } from "@/lib/db/repos/wishlist";
import { SignOutButton } from "@/components/account/SignOutButton";

export const metadata = { title: "Account · Saree Store" };

const TILES: {
  href: string;
  label: string;
  description: string;
  icon: typeof User;
}[] = [
  {
    href: "/account/orders",
    label: "Orders",
    description: "Track recent and past orders.",
    icon: Package,
  },
  {
    href: "/account/addresses",
    label: "Addresses",
    description: "Edit your shipping & billing.",
    icon: MapPin,
  },
  {
    href: "/account/wishlist",
    label: "Wishlist",
    description: "Sarees you've saved for later.",
    icon: Heart,
  },
  {
    href: "/account/profile",
    label: "Profile",
    description: "Update name, email and password.",
    icon: User,
  },
];

export default async function AccountDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account");

  const [orders, addresses, wishlist] = await Promise.all([
    ordersRepo.listByUser(user.id),
    addressesRepo.listByUser(user.id),
    wishlistRepo.listByUser(user.id),
  ]);

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  const stats: { label: string; value: string | number; icon: typeof Package; accent: string }[] = [
    { label: "Orders", value: orders.length, icon: Package, accent: "text-accent-primary" },
    { label: "Addresses", value: addresses.length, icon: MapPin, accent: "text-accent-gold" },
    { label: "Wishlist", value: wishlist.length, icon: Heart, accent: "text-danger" },
    { label: "Member since", value: memberSince, icon: CalendarCheck, accent: "text-success" },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-5 sm:gap-7 md:gap-9">
      {/* ── Header ── */}
      <header className="flex min-w-0 flex-col gap-1.5 sm:gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-accent-gold sm:text-xs">
          <Sparkles className="h-3 w-3" />
          Your space
        </span>
        <h1 className="break-words font-display text-lg leading-tight text-ink-900 sm:text-2xl md:text-3xl">
          Welcome back, {user.fullName.split(" ")[0]}.
        </h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">
          A quick view of your orders, addresses, and saved sarees.
        </p>
      </header>

      {/* ── Stats — 2 per row on mobile, 4 on desktop ── */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="group relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-xl border border-ink-500/10 bg-bg-elevated p-3 transition hover:border-accent-gold/40 hover:shadow-sm sm:gap-2 sm:p-5"
          >
            {/* Top brass hairline */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
            />
            <div className="flex items-center justify-between gap-1.5">
              <span className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-500 sm:text-[11px]">
                {label}
              </span>
              <Icon className={`h-3 w-3 shrink-0 ${accent} sm:h-4 sm:w-4`} />
            </div>
            <div className="truncate font-display text-base leading-none text-ink-900 sm:text-2xl md:text-3xl">
              {value}
            </div>
          </div>
        ))}
      </section>

      {/* ── Quick actions ── */}
      <section className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500 sm:text-xs">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:gap-4 md:grid-cols-2">
          {TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.href}
                href={tile.href}
                className="group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-ink-500/10 bg-bg-elevated p-3 transition hover:border-accent-primary/40 hover:bg-bg-base/60 sm:p-5"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/[0.06] text-accent-primary transition group-hover:bg-accent-primary group-hover:text-bg-base sm:h-12 sm:w-12">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-display text-sm leading-none text-ink-900 sm:text-lg">
                    {tile.label}
                  </span>
                  <span className="truncate text-[10px] text-ink-500 sm:text-xs">
                    {tile.description}
                  </span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-primary sm:h-5 sm:w-5" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Mobile sign-out (sidebar version is desktop-only) ── */}
      <div className="md:hidden">
        <SignOutButton
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-ink-500/30 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-ink-700 transition hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
          pendingChildren="Signing out…"
        >
          Sign out
        </SignOutButton>
      </div>
    </div>
  );
}
