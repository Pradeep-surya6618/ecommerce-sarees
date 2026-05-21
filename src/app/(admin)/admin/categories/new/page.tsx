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
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-xl text-ink-900 sm:text-3xl">New category</h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">
          Categories show on the home page tile grid and at /shop/&lt;slug&gt;.
        </p>
      </header>
      <CategoryForm allCategories={allCategories} />
    </div>
  );
}
