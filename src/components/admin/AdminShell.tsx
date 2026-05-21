"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

const STORAGE_KEY = "admin:sidebarCollapsed";

function readStoredCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export interface AdminShellProps {
  userName: string;
  userEmail: string;
  children: ReactNode;
}

export function AdminShell({ userName, userEmail, children }: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(readStoredCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-bg-base">
      <AdminSidebar
        userName={userName}
        userEmail={userEmail}
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        onDrawerClose={() => setDrawerOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          userName={userName}
          userEmail={userEmail}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
