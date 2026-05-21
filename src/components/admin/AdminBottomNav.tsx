"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, LayoutDashboard, Package, Settings, UsersRound } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

const ITEMS = [
  { href: "/admin/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Banknote },
  { href: "/admin/customers", label: "Customers", icon: UsersRound },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-white/5 bg-ink-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      {ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition",
              active ? "text-white" : "text-white/55 hover:text-white",
            )}
          >
            <span
              className={clsx(
                "inline-flex h-7 w-12 items-center justify-center rounded-full transition",
                active && "bg-accent-primary/30",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
