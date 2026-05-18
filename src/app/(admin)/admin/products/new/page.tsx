import { categoriesRepo } from "@/lib/db/repos/categories";
import { ProductForm } from "@/components/admin/ProductForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata = { title: "New product · Admin" };

export default async function NewProductPage() {
  const categories = await categoriesRepo.list();
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: "New" },
        ]}
      />
      <header>
        <h1 className="font-display text-3xl text-ink-900">New product</h1>
      </header>
      <ProductForm categories={categories} />
    </div>
  );
}
