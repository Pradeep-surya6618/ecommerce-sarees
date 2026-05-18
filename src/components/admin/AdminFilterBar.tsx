"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export interface AdminFilterOption {
  value: string;
  label: string;
}

export interface AdminFilterBarProps {
  searchKey?: string;
  statusKey?: string;
  statusOptions?: AdminFilterOption[];
  placeholder?: string;
}

export function AdminFilterBar({
  searchKey = "q",
  statusKey = "status",
  statusOptions,
  placeholder = "Search…",
}: AdminFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function apply(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          type="search"
          defaultValue={params.get(searchKey) ?? ""}
          placeholder={placeholder}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set(searchKey, e.target.value);
            else next.delete(searchKey);
            apply(next);
          }}
          className="h-9 w-64 rounded-sm border border-ink-500/30 bg-bg-elevated pl-9 pr-3 text-sm text-ink-900 focus:border-accent-primary focus:outline-none"
        />
      </div>
      {statusOptions && (
        <select
          defaultValue={params.get(statusKey) ?? ""}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set(statusKey, e.target.value);
            else next.delete(statusKey);
            apply(next);
          }}
          className="h-9 rounded-sm border border-ink-500/30 bg-bg-elevated px-3 text-sm"
        >
          <option value="">All statuses</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
