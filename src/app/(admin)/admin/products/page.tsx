import { productsRepo } from "@/lib/db/repos/products";
import { ProductsListClient } from "@/components/admin/ProductsListClient";

export const metadata = { title: "Products · Admin" };

export default async function AdminProductsPage() {
  const products = await productsRepo.listAll({ includeArchived: true });
  return <ProductsListClient products={products} />;
}
