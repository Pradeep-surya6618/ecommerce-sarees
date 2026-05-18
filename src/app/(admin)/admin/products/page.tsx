import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { productsRepo } from "@/lib/db/repos/products";
import { formatRupees } from "@/lib/money";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import type { Product } from "@/types/domain";

export const metadata = { title: "Products · Admin" };

const columns: AdminColumn<Product>[] = [
  {
    key: "image",
    header: "",
    width: "64px",
    cell: (p) => (
      <div className="relative h-12 w-10 overflow-hidden rounded-sm bg-ink-500/5">
        {p.images[0] && (
          <Image
            src={p.images[0].url}
            alt={p.images[0].alt}
            fill
            sizes="40px"
            className="object-cover"
          />
        )}
      </div>
    ),
  },
  {
    key: "name",
    header: "Name",
    cell: (p) => (
      <Link
        href={`/admin/products/${p.id}`}
        className="font-medium text-ink-900 hover:text-accent-primary"
      >
        {p.name}
      </Link>
    ),
  },
  { key: "category", header: "Category", cell: (p) => p.categorySlug },
  {
    key: "price",
    header: "Price",
    align: "right",
    cell: (p) => formatRupees(p.priceInPaise),
  },
  {
    key: "stock",
    header: "Stock",
    align: "right",
    cell: (p) => p.variants.reduce((n, v) => n + v.stock, 0),
  },
  {
    key: "status",
    header: "Status",
    cell: (p) => (
      <Badge
        tone={p.status === "active" ? "success" : p.status === "draft" ? "neutral" : "warning"}
      >
        {p.status}
      </Badge>
    ),
  },
];

export default async function AdminProductsPage() {
  const products = await productsRepo.listAll({ includeArchived: true });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Products</h1>
          <p className="text-sm text-ink-700">{products.length} products in store.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary/90"
        >
          <Plus className="h-4 w-4" /> New product
        </Link>
      </header>
      <AdminTable
        columns={columns}
        rows={products}
        getRowKey={(p) => p.id}
        emptyState={
          <div className="rounded-md border border-ink-500/10 bg-bg-elevated px-6 py-12 text-center">
            <p className="text-sm text-ink-500">No products yet.</p>
            <Link
              href="/admin/products/new"
              className="mt-4 inline-flex items-center gap-2 rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary/90"
            >
              <Plus className="h-4 w-4" /> New product
            </Link>
          </div>
        }
      />
    </div>
  );
}
