"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Heart, LayoutDashboard, MapPin, Package, User as UserIcon } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { Container } from "@/components/ui/Container";

const NAV: { href: string; label: string; icon: typeof UserIcon }[] = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile", icon: UserIcon },
];

export interface AccountShellProps {
  userName: string;
  userEmail: string;
  children: ReactNode;
}

export function AccountShell({ userName, userEmail, children }: AccountShellProps) {
  const pathname = usePathname();
  return (
    <Container size="xl" className="py-10">
      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">Account</span>
            <span className="font-display text-2xl text-ink-900">{userName}</span>
            <span className="text-sm text-ink-500">{userEmail}</span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/account"
                  ? pathname === "/account"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition",
                    active
                      ? "bg-ink-900 text-white"
                      : "text-ink-700 hover:bg-ink-900/5 hover:text-ink-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
