"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { Tooltip } from "@/components/admin/Tooltip";

const LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  customers: "Customers",
  coupons: "Coupons",
  banners: "Banners",
  navigation: "Navigation",
  pages: "Pages",
  about: "About page",
  instagram: "Instagram",
  settings: "Settings",
  new: "New",
};

function buildCrumbs(pathname: string | null): { label: string; href: string }[] {
  if (!pathname) return [];
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    const label = LABELS[seg] ?? decodeURIComponent(seg);
    crumbs.push({ label, href: acc });
  }
  return crumbs;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export interface AdminHeaderProps {
  userName: string;
  userEmail: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenDrawer: () => void;
}

export function AdminHeader({
  userName,
  userEmail,
  collapsed,
  onToggleCollapse,
  onOpenDrawer,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);
  const currentCrumb = crumbs[crumbs.length - 1];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/5 bg-ink-900/95 px-3 text-white backdrop-blur-md md:px-6">
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden md:inline-flex">
        <Tooltip
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          side="bottom-start"
          hideOnMobile
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </Tooltip>
      </div>

      <nav
        aria-label="Breadcrumb"
        className="hidden min-w-0 flex-shrink items-center gap-1.5 text-sm md:flex"
      >
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-white/40" aria-hidden />}
              {isLast ? (
                <span className="truncate font-medium text-white">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate text-white/50 transition hover:text-white"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {currentCrumb && (
        <span className="truncate font-display text-lg text-white md:hidden">
          {currentCrumb.label}
        </span>
      )}

      <div className="ml-auto flex items-center gap-1.5 md:gap-3">
        <button
          type="button"
          aria-label="Search"
          onClick={() => searchRef.current?.focus()}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white sm:hidden"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search…"
            className="autofill-on-dark h-9 w-44 rounded-full border border-white/10 bg-white/5 pl-9 pr-14 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-accent-primary focus:bg-white/10 md:w-64"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50 md:inline-flex">
            ⌘K
          </kbd>
        </div>

        <Tooltip label="Notifications" side="bottom-end">
          <button
            type="button"
            aria-label="Notifications"
            className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent-gold" />
          </button>
        </Tooltip>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 p-0.5 transition hover:border-white/25 hover:bg-white/10 md:gap-2 md:pr-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-primary-hover text-[11px] font-semibold leading-none text-white">
              {initialsOf(userName)}
            </span>
            <span className="hidden text-xs font-medium text-white md:inline">
              {userName.split(" ")[0]}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-xl border border-ink-500/10 bg-white shadow-elev"
            >
              <div className="border-b border-ink-500/10 px-4 py-3">
                <p className="truncate text-sm font-medium text-ink-900">{userName}</p>
                <p className="truncate text-xs text-ink-500">{userEmail}</p>
              </div>
              <div className="flex flex-col py-1">
                <Link
                  href="/admin/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-700 transition hover:bg-bg-base/60 hover:text-ink-900"
                  role="menuitem"
                >
                  <UserIcon className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-700 transition hover:bg-bg-base/60 hover:text-ink-900"
                  role="menuitem"
                >
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </Link>
              </div>
              <form action={logoutAction} className="border-t border-ink-500/10">
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-danger transition hover:bg-danger/5"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
