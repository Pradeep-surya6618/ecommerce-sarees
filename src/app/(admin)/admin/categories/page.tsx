import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import type { Category } from "@/types/domain";

export const metadata = { title: "Categories · Admin" };

interface Row extends Category {
  productCount: number;
}

const columns: AdminColumn<Row>[] = [
  {
    key: "image",
    header: "",
    width: "64px",
    cell: (c) => (
      <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-ink-500/5">
        {c.imageUrl && (
          <Image src={c.imageUrl} alt={c.name} fill sizes="48px" className="object-cover" />
        )}
      </div>
    ),
  },
  {
    key: "name",
    header: "Name",
    cell: (c) => (
      <Link
        href={`/admin/categories/${c.slug}`}
        className="font-medium text-ink-900 hover:text-accent-primary"
      >
        {c.name}
      </Link>
    ),
  },
  {
    key: "slug",
    header: "Slug",
    cell: (c) => <span className="font-mono text-xs">/shop/{c.slug}</span>,
  },
  {
    key: "parent",
    header: "Parent",
    cell: (c) =>
      c.parentSlug ? (
        <Badge tone="neutral">{c.parentSlug}</Badge>
      ) : (
        <span className="text-ink-500">—</span>
      ),
  },
  { key: "sortOrder", header: "Sort", align: "right", cell: (c) => c.sortOrder },
  {
    key: "products",
    header: "Products",
    align: "right",
    cell: (c) =>
      c.productCount > 0 ? (
        <span className="text-ink-900">{c.productCount}</span>
      ) : (
        <span className="text-ink-500">0</span>
      ),
  },
];

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    categoriesRepo.list(),
    productsRepo.listAll({ includeArchived: true }),
  ]);

  const rows: Row[] = categories.map((c) => ({
    ...c,
    productCount: products.filter((p) => p.categorySlug === c.slug).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Categories</h1>
          <p className="text-sm text-ink-700">{categories.length} categories in store.</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
        >
          <Plus className="h-4 w-4" /> New category
        </Link>
      </header>
      <AdminTable<Row> columns={columns} rows={rows} getRowKey={(c) => c.id} />
      <p className="text-xs text-ink-500">
        Products are linked to a category by its slug. After creating a category, edit a product and
        pick this category from the dropdown.
      </p>
    </div>
  );
}
