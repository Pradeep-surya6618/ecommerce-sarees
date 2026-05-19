"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Banknote,
  BookOpen,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  ListTree,
  LogOut,
  Package,
  Settings,
  Tag,
  UsersRound,
} from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { logoutAction } from "@/server/actions/auth";
import { InstagramGlyph } from "@/components/shared/icons";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: Banknote },
  { href: "/admin/customers", label: "Customers", icon: UsersRound },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/navigation", label: "Navigation", icon: ListTree },
  { href: "/admin/about", label: "About page", icon: BookOpen },
  { href: "/admin/instagram", label: "Instagram", icon: InstagramGlyph },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export interface AdminShellProps {
  userName: string;
  userEmail: string;
  children: ReactNode;
}

export function AdminShell({ userName, userEmail, children }: AdminShellProps) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col bg-ink-900 text-bg-base">
          <div className="flex flex-col gap-1 px-6 py-6">
            <span className="text-xs uppercase tracking-[0.25em] text-accent-gold">Admin</span>
            <Link href="/" className="font-display text-2xl">
              Saree Store
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3">
            {NAV.map((item) => {
              const active =
                item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "inline-flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition",
                    active
                      ? "bg-bg-base/10 text-bg-base"
                      : "text-bg-base/70 hover:bg-bg-base/5 hover:text-bg-base",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-bg-base/10 px-6 py-4 text-xs">
            <p className="font-medium text-bg-base">{userName}</p>
            <p className="text-bg-base/60">{userEmail}</p>
            <form action={logoutAction} className="mt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-bg-base/70 transition hover:text-bg-base"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </aside>
        <main className="px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
