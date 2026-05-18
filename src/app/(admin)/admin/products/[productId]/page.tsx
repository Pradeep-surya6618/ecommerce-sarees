import { notFound } from "next/navigation";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { productId } = await params;
  const [product, categories] = await Promise.all([
    productsRepo.getById(productId),
    categoriesRepo.list(),
  ]);
  if (!product) notFound();
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: product.name },
        ]}
      />
      <header>
        <h1 className="font-display text-3xl text-ink-900">Edit · {product.name}</h1>
      </header>
      <ProductForm categories={categories} editId={product.id} defaultProduct={product} />
    </div>
  );
}
