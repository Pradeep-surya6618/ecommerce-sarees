import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { bannersRepo } from "@/lib/db/repos/banners";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import type { Banner } from "@/types/domain";

export const metadata = { title: "Banners · Admin" };

export default async function AdminBannersPage() {
  const banners = await bannersRepo.listAll();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Banners</h1>
          <p className="text-sm text-ink-700">{banners.length} banners.</p>
        </div>
        <Link
          href="/admin/banners/new"
          className="inline-flex items-center gap-2 rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary/90"
        >
          <Plus className="h-4 w-4" /> New banner
        </Link>
      </header>
      <AdminTable<Banner>
        columns={[
          {
            key: "image",
            header: "",
            width: "80px",
            cell: (b) => (
              <div className="relative h-12 w-16 overflow-hidden rounded-sm bg-ink-500/5">
                {b.imageUrl && (
                  <Image
                    src={b.imageUrl}
                    alt={b.imageAlt}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
            ),
          },
          {
            key: "title",
            header: "Title",
            cell: (b) => (
              <Link
                href={`/admin/banners/${b.id}`}
                className="font-medium text-ink-900 hover:text-accent-primary"
              >
                {b.title}
              </Link>
            ),
          },
          {
            key: "placement",
            header: "Placement",
            cell: (b) => <span className="font-mono text-xs text-ink-700">{b.placement}</span>,
          },
          {
            key: "sortOrder",
            header: "Order",
            align: "right",
            cell: (b) => b.sortOrder,
          },
          {
            key: "active",
            header: "Status",
            cell: (b) => (
              <Badge tone={b.active ? "success" : "neutral"}>
                {b.active ? "Active" : "Inactive"}
              </Badge>
            ),
          },
        ]}
        rows={banners}
        getRowKey={(b) => b.id}
        emptyState={
          <div className="rounded-md border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
            <p className="text-sm text-ink-500">No banners yet.</p>
            <Link
              href="/admin/banners/new"
              className="mt-4 inline-flex items-center gap-2 rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary/90"
            >
              <Plus className="h-4 w-4" /> New banner
            </Link>
          </div>
        }
      />
    </div>
  );
}
