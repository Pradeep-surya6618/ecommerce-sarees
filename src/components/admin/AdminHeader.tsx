"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
} from "lucide-react";
import { adminLogoutAction } from "@/server/actions/admin-auth";
import { Tooltip } from "@/components/admin/Tooltip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  function confirmSignOut() {
    startSignOut(async () => {
      try {
        await adminLogoutAction();
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        setSignOutOpen(false);
      }
    });
  }
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
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
              className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-base shadow-[0_24px_60px_rgba(37,31,62,0.18)]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/70 to-transparent"
              />

              {/* ── Identity card ── */}
              <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-primary-hover text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(91,58,138,0.6)]">
                  {initialsOf(userName)}
                </span>
                <div className="flex min-w-0 flex-col leading-tight">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold">
                    Admin
                  </span>
                  <p className="truncate text-sm font-medium text-ink-900">{userName}</p>
                  <p className="truncate text-[11px] text-ink-500">{userEmail}</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-ink-500/15 to-transparent" />

              {/* ── Menu items ── */}
              <div className="flex flex-col gap-0.5 p-1.5">
                <Link
                  href="/admin/settings"
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-700 transition hover:bg-bg-elevated hover:text-ink-900"
                  role="menuitem"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-gold/15 text-accent-gold transition group-hover:bg-accent-gold/20">
                    <SettingsIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[13px] font-medium">Settings</span>
                    <span className="text-[10px] text-ink-500">Store profile & integrations.</span>
                  </span>
                </Link>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-ink-500/15 to-transparent" />

              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setSignOutOpen(true);
                  }}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-danger transition hover:bg-danger/[0.06]"
                  role="menuitem"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger transition group-hover:bg-danger/15">
                    <LogOut className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[13px] font-medium">Sign out</span>
                    <span className="text-[10px] text-danger/70">End this session.</span>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={confirmSignOut}
        title="Sign out of admin?"
        description={`You'll need to sign in again to manage the store. Signed in as ${userName}.`}
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        tone="danger"
        icon={LogOut}
        pending={signingOut}
      />
    </header>
  );
}
