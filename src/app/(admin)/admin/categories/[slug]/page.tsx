import Link from "next/link";
import { notFound } from "next/navigation";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [category, allCategories, allProducts] = await Promise.all([
    categoriesRepo.getBySlug(slug),
    categoriesRepo.list(),
    productsRepo.listAll({ includeArchived: true }),
  ]);
  if (!category) notFound();

  const productsInCategory = allProducts.filter((p) => p.categorySlug === category.slug);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Categories", href: "/admin/categories" },
          { label: category.name },
        ]}
      />
      <header>
        <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Edit · {category.name}</h1>
      </header>

      <CategoryForm allCategories={allCategories} editId={category.id} defaultCategory={category} />

      <section className="rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <h2 className="mb-3 font-display text-base text-ink-900 sm:text-lg md:text-xl">
          Products in this category ({productsInCategory.length})
        </h2>
        {productsInCategory.length === 0 ? (
          <p className="text-[11px] text-ink-500 sm:text-sm">
            No products yet. Open a product and pick this category from the dropdown.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-ink-500/10">
            {productsInCategory.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link
                  href={`/admin/products/${p.id}`}
                  className="text-ink-900 transition hover:text-accent-primary"
                >
                  {p.name}
                </Link>
                <span className="text-[10px] uppercase tracking-wider text-ink-500 sm:text-xs">
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
