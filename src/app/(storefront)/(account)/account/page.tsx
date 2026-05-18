import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Heart, MapPin, Package, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { addressesRepo } from "@/lib/db/repos/addresses";
import { ordersRepo } from "@/lib/db/repos/orders";
import { wishlistRepo } from "@/lib/db/repos/wishlist";
import { logoutAction } from "@/server/actions/auth";

export const metadata = { title: "Account · Saree Store" };

const TILES = [
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile", icon: User },
];

export default async function AccountDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account");

  const [orders, addresses, wishlist] = await Promise.all([
    ordersRepo.listByUser(user.id),
    addressesRepo.listByUser(user.id),
    wishlistRepo.listByUser(user.id),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-ink-900 md:text-4xl">
          Welcome back, {user.fullName.split(" ")[0]}.
        </h1>
        <p className="text-ink-700">
          A quick view of your orders, saved addresses, and saved sarees.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Orders", value: orders.length },
          { label: "Addresses", value: addresses.length },
          { label: "Wishlist", value: wishlist.length },
          {
            label: "Member since",
            value: new Date(user.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            }),
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-md border border-ink-500/10 bg-bg-elevated p-4">
            <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
            <div className="mt-1 font-display text-2xl text-ink-900">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className="group flex items-center justify-between gap-4 rounded-md border border-ink-500/10 bg-bg-elevated p-6 transition hover:border-ink-900"
            >
              <div className="flex items-center gap-4">
                <Icon className="h-6 w-6 text-accent-gold" />
                <span className="font-display text-xl text-ink-900">{tile.label}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-500 transition group-hover:text-ink-900" />
            </Link>
          );
        })}
      </section>

      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-sm border border-ink-500/30 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-900 hover:text-ink-900"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
