import Link from "next/link";
import { Plus } from "lucide-react";
import { couponsRepo } from "@/lib/db/repos/coupons";
import { formatRupees, paiseToRupees } from "@/lib/money";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import type { Coupon } from "@/types/domain";

export const metadata = { title: "Coupons · Admin" };

export default async function AdminCouponsPage() {
  const coupons = await couponsRepo.listAll();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Coupons</h1>
          <p className="text-sm text-ink-700">{coupons.length} coupons.</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary/90"
        >
          <Plus className="h-4 w-4" /> New coupon
        </Link>
      </header>
      <AdminTable<Coupon>
        columns={[
          {
            key: "code",
            header: "Code",
            cell: (c) => (
              <Link
                href={`/admin/coupons/${encodeURIComponent(c.code)}`}
                className="font-mono font-medium text-ink-900 hover:text-accent-primary"
              >
                {c.code}
              </Link>
            ),
          },
          {
            key: "type",
            header: "Type / Value",
            cell: (c) =>
              c.type === "percent" ? `${c.value}% off` : `${formatRupees(c.value)} off`,
          },
          {
            key: "uses",
            header: "Used",
            align: "right",
            cell: (c) =>
              c.maxUses != null ? `${c.usedCount} / ${c.maxUses}` : `${c.usedCount} / ∞`,
          },
          {
            key: "minOrder",
            header: "Min order",
            align: "right",
            cell: (c) => (c.minOrderPaise != null ? formatRupees(c.minOrderPaise) : "—"),
          },
          {
            key: "validTo",
            header: "Expires",
            cell: (c) =>
              new Date(c.validTo).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
          },
          {
            key: "status",
            header: "Status",
            cell: (c) => (
              <Badge tone={c.status === "active" ? "success" : "warning"}>{c.status}</Badge>
            ),
          },
        ]}
        rows={coupons}
        getRowKey={(c) => c.code}
        emptyState={
          <div className="rounded-md border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
            <p className="text-sm text-ink-500">No coupons yet.</p>
            <Link
              href="/admin/coupons/new"
              className="mt-4 inline-flex items-center gap-2 rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary/90"
            >
              <Plus className="h-4 w-4" /> New coupon
            </Link>
          </div>
        }
      />
    </div>
  );
}
