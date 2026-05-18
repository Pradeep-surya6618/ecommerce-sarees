import type { ReactNode } from "react";
import { clsx } from "@/lib/utils/clsx";

export interface AdminColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  width?: string;
}

export interface AdminTableProps<T> {
  columns: AdminColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyState?: ReactNode;
}

export function AdminTable<T>({ columns, rows, getRowKey, emptyState }: AdminTableProps<T>) {
  if (rows.length === 0 && emptyState) return <>{emptyState}</>;
  return (
    <div className="overflow-x-auto rounded-md border border-ink-500/10 bg-bg-elevated">
      <table className="min-w-full divide-y divide-ink-500/10 text-sm">
        <thead className="bg-bg-base/40">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={clsx(
                  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-500",
                  col.align === "right" ? "text-right" : "text-left",
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-500/10">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="transition hover:bg-bg-base/30">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(
                    "px-4 py-3 text-ink-700",
                    col.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
