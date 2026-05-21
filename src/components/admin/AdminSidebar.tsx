"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Banknote,
  BookOpen,
  FileText,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  ListTree,
  LogOut,
  Package,
  Settings,
  Tag,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { logoutAction } from "@/server/actions/auth";
import { Tooltip } from "@/components/admin/Tooltip";
import { InstagramGlyph } from "@/components/shared/icons";

type NavItem = { href: string; label: string; icon: LucideIcon | typeof InstagramGlyph };

type NavSection = { heading: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    heading: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/orders", label: "Orders", icon: Banknote },
      { href: "/admin/customers", label: "Customers", icon: UsersRound },
      { href: "/admin/coupons", label: "Coupons", icon: Tag },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
      { href: "/admin/navigation", label: "Navigation", icon: ListTree },
      { href: "/admin/pages", label: "Pages", icon: FileText },
      { href: "/admin/about", label: "About page", icon: BookOpen },
      { href: "/admin/instagram", label: "Instagram", icon: InstagramGlyph },
    ],
  },
  {
    heading: "Account",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  collapsed: boolean;
  drawerOpen: boolean;
  onDrawerClose: () => void;
}

export function AdminSidebar({
  userName,
  userEmail,
  collapsed,
  drawerOpen,
  onDrawerClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDrawerClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, onDrawerClose]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      return;
    }
    const id = window.setTimeout(() => {
      document.body.style.overflow = "";
    }, 360);
    return () => window.clearTimeout(id);
  }, [drawerOpen]);

  useEffect(
    () => () => {
      document.body.style.overflow = "";
    },
    [],
  );

  return (
    <>
      <div
        aria-hidden
        onClick={onDrawerClose}
        style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
        className={clsx(
          "fixed inset-0 z-40 bg-ink-900/60 backdrop-blur-sm transition-opacity duration-[350ms] md:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        style={{
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          transform: drawerOpen ? "translate3d(0,0,0)" : "translate3d(-100%,0,0)",
        }}
        className={clsx(
          "fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-white/5 bg-ink-900 text-bg-base shadow-2xl transition-[transform,width] duration-[360ms] will-change-transform md:sticky md:!transform-none md:shadow-none",
          collapsed ? "md:w-[72px]" : "md:w-[240px]",
        )}
      >
        <div
          className={clsx(
            "flex items-center justify-between gap-3 border-b border-white/5 px-4 py-5",
            collapsed && "md:justify-center md:px-0",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-primary-hover font-display text-lg text-white shadow-[0_8px_20px_-8px_rgba(91,58,138,0.8)]">
              S
            </div>
            <Link
              href="/"
              className={clsx(
                "font-display text-base leading-tight text-white",
                collapsed && "md:hidden",
              )}
            >
              Saree Store
            </Link>
          </div>
          <button
            type="button"
            onClick={onDrawerClose}
            aria-label="Close menu"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-white/60 transition hover:bg-white/5 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="scrollbar-hide flex-1 overflow-y-auto px-2 py-4">
          {SECTIONS.map((section) => (
            <div key={section.heading} className="mb-4 last:mb-0">
              <div
                className={clsx(
                  "px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35",
                  collapsed && "md:hidden",
                )}
              >
                {section.heading}
              </div>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  const link = (
                    <Link
                      href={item.href}
                      onClick={onDrawerClose}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                        collapsed && "md:justify-center md:px-0",
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent-gold"
                        />
                      )}
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className={clsx(collapsed && "md:hidden", "truncate")}>
                        {item.label}
                      </span>
                    </Link>
                  );
                  return (
                    <li key={item.href} className="relative">
                      {collapsed ? (
                        <Tooltip label={item.label} side="right" hideOnMobile className="w-full">
                          {link}
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/5 p-3">
          <div
            className={clsx(
              "flex items-center gap-3 rounded-lg bg-white/[0.03] p-2",
              collapsed && "md:justify-center md:bg-transparent",
            )}
          >
            {collapsed ? (
              <Tooltip label={`${userName} · ${userEmail}`} side="right" hideOnMobile>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-primary-hover text-xs font-semibold text-white">
                  {initialsOf(userName)}
                </div>
              </Tooltip>
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-primary-hover text-xs font-semibold text-white">
                {initialsOf(userName)}
              </div>
            )}
            <div className={clsx("flex min-w-0 flex-col leading-tight", collapsed && "md:hidden")}>
              <span className="truncate text-xs font-medium text-white">{userName}</span>
              <span className="truncate text-[10px] text-white/50">{userEmail}</span>
            </div>
          </div>
          <form action={logoutAction} className="mt-2">
            {collapsed ? (
              <Tooltip label="Sign out" side="right" hideOnMobile className="w-full">
                <button
                  type="submit"
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-0 py-1.5 text-xs text-white/60 transition hover:text-white"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                </button>
              </Tooltip>
            ) : (
              <button
                type="submit"
                className="inline-flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/60 transition hover:text-white"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign out</span>
              </button>
            )}
          </form>
        </div>
      </aside>
    </>
  );
}
