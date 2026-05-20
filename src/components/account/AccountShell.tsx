"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, User as UserIcon } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { logoutAction } from "@/server/actions/auth";
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

function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function isActive(pathname: string | null, href: string): boolean {
  if (href === "/account") return pathname === "/account";
  return pathname?.startsWith(href) ?? false;
}

export function AccountShell({ userName, userEmail, children }: AccountShellProps) {
  const pathname = usePathname();
  const initials = initialsFor(userName);

  return (
    <Container size="xl" className="px-4! py-5 sm:px-6! sm:py-8 md:px-8! md:py-10">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[240px_minmax(0,1fr)] md:gap-8">
        {/* ── Mobile-only: identity strip + full-bleed horizontal nav ── */}
        <div className="flex flex-col gap-3 md:hidden">
          <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated px-4 py-3.5">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 font-display text-sm text-bg-base">
              {initials || "·"}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold">
                Account
              </span>
              <span className="truncate font-display text-sm leading-tight text-ink-900">
                {userName}
              </span>
              <span className="truncate text-[10px] text-ink-500">{userEmail}</span>
            </div>
          </div>

          {/* Full-bleed pill nav row — negative margins match Container px */}
          <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:-mx-6 sm:px-6">
            <nav className="flex w-max gap-2 pb-1">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                      active
                        ? "border-ink-900 bg-ink-900 text-bg-base shadow-sm"
                        : "border-ink-500/15 bg-bg-elevated text-ink-700 hover:border-ink-900/30 hover:text-ink-900",
                    )}
                  >
                    <Icon
                      className={clsx("h-3.5 w-3.5", active ? "text-accent-gold" : "text-ink-500")}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ── Desktop-only: sticky sidebar card ── */}
        <aside className="hidden md:sticky md:top-24 md:block md:self-start">
          <div className="flex flex-col gap-5 overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated">
            <div className="relative flex items-center gap-3 border-b border-ink-500/10 px-5 py-4">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
              />
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 font-display text-base text-bg-base">
                {initials || "·"}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold">
                  Account
                </span>
                <span className="truncate font-display text-base leading-tight text-ink-900">
                  {userName}
                </span>
                <span className="truncate text-[11px] text-ink-500">{userEmail}</span>
              </div>
            </div>

            <nav className="flex flex-col gap-1 px-3">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "group inline-flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-ink-900 text-bg-base shadow-sm"
                        : "text-ink-700 hover:bg-ink-900/[0.06] hover:text-ink-900",
                    )}
                  >
                    <Icon
                      className={clsx(
                        "h-4 w-4 transition",
                        active ? "text-accent-gold" : "text-ink-500 group-hover:text-ink-900",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <form action={logoutAction} className="border-t border-ink-500/10 px-3 py-3">
              <button
                type="submit"
                className="inline-flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-700 transition hover:bg-danger/10 hover:text-danger"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* ── Content (single instance, lives in column 2 on desktop, row 2 on mobile) ── */}
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
