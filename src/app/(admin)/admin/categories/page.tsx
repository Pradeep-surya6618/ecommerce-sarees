import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { CategoriesListClient, type CategoryRow } from "@/components/admin/CategoriesListClient";

export const metadata = { title: "Categories · Admin" };

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    categoriesRepo.list(),
    productsRepo.listAll({ includeArchived: true }),
  ]);

  const rows: CategoryRow[] = categories.map((c) => ({
    ...c,
    productCount: products.filter((p) => p.categorySlug === c.slug).length,
  }));

  return <CategoriesListClient rows={rows} />;
}
