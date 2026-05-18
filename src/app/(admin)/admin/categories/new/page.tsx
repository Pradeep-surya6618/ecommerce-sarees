import { categoriesRepo } from "@/lib/db/repos/categories";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata = { title: "New category · Admin" };

export default async function NewCategoryPage() {
  const allCategories = await categoriesRepo.list();
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Categories", href: "/admin/categories" },
          { label: "New" },
        ]}
      />
      <header>
        <h1 className="font-display text-3xl text-ink-900">New category</h1>
        <p className="text-sm text-ink-700">
          Categories show on the home page tile grid and at /shop/&lt;slug&gt;.
        </p>
      </header>
      <CategoryForm allCategories={allCategories} />
    </div>
  );
}
