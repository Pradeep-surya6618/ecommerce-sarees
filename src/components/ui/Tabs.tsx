"use client";

import { createContext, useContext, useId, useState } from "react";
import { clsx } from "@/lib/utils/clsx";

interface TabsCtx {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
}

const Ctx = createContext<TabsCtx | null>(null);

function useTabs(): TabsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Tabs.* must be used inside <Tabs>");
  return ctx;
}

export function Tabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const baseId = useId();
  return (
    <Ctx.Provider value={{ value, setValue, baseId }}>
      <div className={clsx("flex flex-col gap-6", className)}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="tablist" className={clsx("flex gap-2 border-b border-ink-500/15", className)}>
      {children}
    </div>
  );
}

export function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: active, setValue, baseId } = useTabs();
  const isActive = active === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      onClick={() => setValue(value)}
      className={clsx(
        "border-b-2 px-4 py-3 text-sm font-medium transition",
        isActive
          ? "border-accent-primary text-ink-900"
          : "border-transparent text-ink-500 hover:text-ink-700",
      )}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: active, baseId } = useTabs();
  if (active !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      className="text-ink-700"
    >
      {children}
    </div>
  );
}
